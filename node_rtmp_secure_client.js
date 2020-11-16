/* node_rtmp_secure_client.js
 * This is an extension of NodeRtmpClient with modified RTMP Handshake.
 * The constructor needs one more argument: intended_streamId which will be used for stream key for broadcasting.
 * nonceGenerate() method generates nonce based on intended_streamId.
 * when _start() is called, it prepares c0c1 packet with nonce.
 */
const NodeRtmpClient = require('./node_rtmp_client');
const Net = require('net');
const Crypto = require('crypto');
const Logger = require('./node_core_logger');

class NodeRtmpSecureClient extends NodeRtmpClient{
    constructor(rtmpUrl, intended_streamId) {
        super(rtmpUrl);
        this.intended_streamId = intended_streamId;
        this.nonce_length = 32;
    }

    startPull() {
        Logger.error("NodeRtmpSecureClient does not support Pull");
    }

    nonceGenerate() {
        let hash = Crypto.createHash('sha256');
        hash.update(this.intended_streamId);
        let result = hash.digest();
        return result;
    }
    
    /* override rtmp handshake */
    _start() {
        this.socket = Net.createConnection(this.info.port, this.info.hostname, () => {
            //rtmp handshake c0c1
            let c0c1 = Crypto.randomBytes(1537);
            c0c1.writeUInt8(3); //c0
            this.nonceGenerate().copy(c0c1, 1, 0, this.nonceLength); //c1
            this.socket.write(c0c1);
        });
        this.socket.on('data', this.onSocketData.bind(this));
        this.socket.on('error', this.onSocketError.bind(this));
        this.socket.on('close', this.onSocketClose.bind(this));
        this.socket.on('timeout', this.onSocketTimeout.bind(this));
        this.socket.setTimeout(60000);
    }
}

module.exports = NodeRtmpSecureClient;
