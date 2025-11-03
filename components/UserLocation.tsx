// import React, { useRef } from 'react';
// import MapboxGL from '@rnmapbox/maps';

// const UserLocationMarker = React.memo(() => {
//   const renderCount = useRef(0);
//   renderCount.current++;

//   console.log('UserLocation render count:', renderCount.current); // debug nếu muốn

//   return (
//     <MapboxGL.UserLocation
//       visible={true}
//       showsUserHeadingIndicator={false}
//       minDisplacement={10}
//       onUpdate={() => {}} // không cập nhật state ở đây
//     />
//   );    
// }, () => true); // <-- chặn re-render hoàn toàn

// export default UserLocationMarker;