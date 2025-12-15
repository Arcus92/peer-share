# PeerShare

PeerShare is a web tool for easy and fast file transfers using a peer-to-peer connection.

## How it works

Any user can create a temporary PeerShare session - no login or registration required. Another user can join the session 
via the generate link or QR code. 

PeerShare then establishes a peer-to-peer connection that is used for further communication. Now both users can share 
file. The files stored temporarily in memory and can be saved once the data was transferred.

## Security

PeerShare is only handling the initial handshare and pairing of the WebRTC connection. The file requests and file 
transfer is handled via WebRTC.

WebRTC will use STUN and TURN servers if you NAT isn't configured for peer-to-peer connction. The files will the pass an
external relay server. **File requests and file transferes are currently unencrypted!**

## Issues / Todos

- There is no checksum check. If packages were lost the files may be invalid.
- It is currently not possible to resume file transfer.
- There should be a small passphrase or a visible number to verify both clients connect to the desired session.
- There should be additinal compression and encryption.

## Demo

[Try it out!](https://share.david-schulte.de/)