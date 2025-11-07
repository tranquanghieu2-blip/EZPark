import EventEmitter from 'eventemitter3';

export const mapEvents = new EventEmitter();

export const EVENT_OPEN_SPOT = 'openSpot';
export const EVENT_FAVORITE_CHANGED = 'EVENT_FAVORITE_CHANGED';
export const EVENT_USER_LOGIN = 'EVENT_USER_LOGIN';
export const EVENT_USER_LOGOUT = 'EVENT_USER_LOGOUT';