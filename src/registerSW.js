
export default function startServiceWorker() {
  /*Register Service Worker*/
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js', {scope: '/'})
    .then(reg =>{
      console.log("Service worker registered " + reg.scope)
    })
    .catch(error => {
      console.log("Service worker registation failed:" + error);
    });
  }
}
