import { useState, useRef, useCallback, useEffect } from 'react';
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import axios from 'axios';
import { Platform, PermissionsAndroid } from 'react-native';

// Cấu hình Google API
const GOOGLE_API_KEY = 'AIzaSyCLEyeZlqU5ei4N0VOHI4zTK0cpYRGHLsk';
const GOOGLE_STT_URL = `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`;

interface UseSpeechToTextProps {
  onSpeechDetected: (text: string) => void; // Callback khi có text từ Google
}

export const useSpeechToText = ({ onSpeechDetected }: UseSpeechToTextProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Refs để quản lý logic im lặng mà không gây re-render
  const silenceStartRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  // Fallback options
  const autoStopEnabledRef = useRef(true); // nếu false -> không auto stop dựa trên silence
  const maxRecordingMsRef = useRef<number | null>(60000); // max 60s, null = no limit
  const maxTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cấu hình ngưỡng im lặng (Tuỳ chỉnh dựa trên môi trường thực tế)
  // Amplitude của 16-bit PCM từ -32768 đến 32767.
  // Ngưỡng thấp (im lặng) thường rơi vào khoảng dưới 500-1000 tuỳ mic.
  const SILENCE_THRESHOLD = 900; 
  const SILENCE_DURATION = 1000; // 1 giây

  useEffect(() => {
    // Init Audio Record options
    const options = {
      sampleRate: 16000,  // Google STT thích 16000
      channels: 1,        // Mono
      bitsPerSample: 16,  // 16-bit
      audioSource: 6,     // Voice Recognition source
      wavFile: 'voice_query.wav' // Tên file
    };
    
    AudioRecord.init(options);

    // Listener nhận data buffer realtime để detect silence
    AudioRecord.on('data', (data) => {
      if (!isRecordingRef.current) return;
      
      // Decode base64 chunk sang buffer để tính biên độ (amplitude)
      const buffer = Buffer.from(data, 'base64');
      let maxAmplitude = 0;
      
      // Duyệt qua buffer (2 bytes mỗi mẫu vì là 16-bit)
      for (let i = 0; i < buffer.length; i += 2) {
        const sample = buffer.readInt16LE(i);
        const amplitude = Math.abs(sample);
        if (amplitude > maxAmplitude) maxAmplitude = amplitude;
      }

      // Nếu auto-stop bị tắt thì bỏ qua logic silence
      if (!autoStopEnabledRef.current) {
        return;
      }

      // Logic Detect Silence
      if (maxAmplitude < SILENCE_THRESHOLD) {
        if (silenceStartRef.current === null) {
          silenceStartRef.current = Date.now(); // Bắt đầu đếm giờ im lặng
        } else {
          const diff = Date.now() - silenceStartRef.current;
          if (diff > SILENCE_DURATION) {
            console.log("Silence detected > 2s. Stopping...");
            stopRecording(); // Tự động dừng
          }
        }
      } else {
        // Có tiếng nói -> Reset timer
        silenceStartRef.current = null;
      }
    });

    return () => {
        // Cleanup nếu component unmount
        stopRecording();
    };
  }, []);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS cần config Info.plist
  };

  const startRecording = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      console.warn('No audio permission');
      return;
    }

    setIsRecording(true);
    isRecordingRef.current = true;
    silenceStartRef.current = null; // Reset silence timer
    AudioRecord.start();
    console.log('Recording started...');

    // Start max-recording timer fallback
    if (maxRecordingMsRef.current) {
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      maxTimerRef.current = setTimeout(() => {
        console.log('Max recording time reached. Forcing stop.');
        stopRecording();
      }, maxRecordingMsRef.current);
    }
  };

  const stopRecording = async () => {
    if (!isRecordingRef.current) return;

    setIsRecording(false);
    isRecordingRef.current = false;
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    
    try {
      const audioFile = await AudioRecord.stop();
      console.log('Recording stopped. File saved at:', audioFile);
      await sendToGoogleSTT(audioFile);
    } catch (error) {
      console.error('Error stopping record:', error);
    }
  };

  const sendToGoogleSTT = async (filePath: string) => {
    setProcessing(true);
    try {
      // 1. Đọc file sang Base64
      const base64Audio = await RNFS.readFile(filePath, 'base64');

      // 2. Gọi Google Cloud STT API
      const response = await axios.post(GOOGLE_STT_URL, {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'vi-VN',
        },
        audio: {
          content: base64Audio,
        },
      });

      // 3. Parse kết quả
      const results = response.data.results;
      if (results && results.length > 0) {
        const transcript = results[0].alternatives[0].transcript;
        console.log('Google STT Result:', transcript);
        onSpeechDetected(transcript); // Callback trả text về UI
      } else {
        console.log('No speech detected by Google.');
      }
    } catch (error) {
      console.error('Error sending to Google STT:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Allow consumer to toggle auto-stop behaviour (e.g., when car audio detected)
  const setAutoStopEnabled = (enabled: boolean) => {
    autoStopEnabledRef.current = enabled;
  };

  const setMaxRecordingMs = (ms: number | null) => {
    maxRecordingMsRef.current = ms;
  };

  return {
    isRecording,
    processing,
    startRecording,
    stopRecording, // Expose hàm này nếu muốn dừng thủ công
    setAutoStopEnabled,
    setMaxRecordingMs,
  };
};