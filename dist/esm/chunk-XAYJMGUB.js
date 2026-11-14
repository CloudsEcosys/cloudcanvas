/*!
 * CloudCanvas v0.7.0 - CloudCanvas core: blits, thin handles over DOM elements on an infinite canvas
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas#readme
 */
var r=Object.freeze({debug:10,info:20,warn:30,error:40});function s({level:o,message:n,args:e}){if(typeof console>"u")return;let t=typeof console[o]=="function"?console[o]:console.log;typeof t=="function"&&t.call(console,`[CloudCanvas] ${n}`,...e)}var c=s,f=r.error;function a(o,{level:n="error"}={}){if(o!==null&&typeof o!="function")throw new TypeError("setLogSink expects a function or null");if(!Object.hasOwn(r,n))throw new RangeError(`unknown log level "${n}"; expected one of ${Object.keys(r).join(", ")}`);let e=c;return c=o,f=r[n],e}function u(o,n,e,t){if(!(c===null||r[o]<f))try{c({level:o,scope:n,message:e,args:t})}catch{}}function l(o){let n=typeof o=="string"&&o!==""?o:"cloudcanvas";return Object.freeze(Object.fromEntries(Object.keys(r).map(e=>[e,(t,...i)=>u(e,n,String(t),i)])))}export{r as a,s as b,a as c,l as d};
