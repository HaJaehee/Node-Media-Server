const NodeRtmpSecureClient = require('./node_rtmp_secure_client');
const NodeRtmpClient = require('./node_rtmp_client');

/* viewer.js
 * RUN viewer.js on black.
 * It polls video from Jupiter's media server, and send it to local
 * In baekjun's computer, the python viewer can grap the video from black
 */

let LOCAL_IP = '127.0.0.1';
let JUPITER_IP = '10.0.10.1';

let PULLING_STREAM_KEY = 'wins'; //pull from jupiter
let PUSH_STREAM_KEY = 'black'; //push to local

let pulling_rtmp_url = 'rtmp://' + JUPITER_IP + '/live/' + PULLING_STREAM_KEY;
let push_rtmp_url = 'rtmp://' + LOCAL_IP + '/live/' + PUSH_STREAM_KEY;

let pulling_client = new NodeRtmpClient(pulling_rtmp_url);
let push_client = new NodeRtmpClient(push_rtmp_url);

pulling_client.on('video', (videoData, timestamp) => {
    push_client.pushVideo(videoData, timestamp);
});

async function run_pulling_client() {
    pulling_client.startPull();
    console.log('pulling_client start');
}

async function run_push_client() {
    push_client.startPush();
    console.log('push_client start');
}

run_pulling_client();
run_push_client();
