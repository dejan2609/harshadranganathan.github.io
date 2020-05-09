---
layout: post
title:  "Blockchain"
date:   2019-06-09
excerpt: "Fundamentals of blockchain and how it works"
tag:
- blockchain
- blockchain explained
- blockchain tutorial
comments: true
---

## Introduction to Blockchain

Blockchain is a decentralized, distributed and public digital ledger that is used to maintain a continuously growing list of records, called blocks, which are linked using cryptography. Any involved record cannot be altered retroactively, without the alteration of all subsequent blocks.

## Benefits of Blockchain

1. Decentralized - Not owned by a single entity. Every participant in the network can access the history of transactions or confirm new transactions.

2. Transparency - Public verifiability of transactions.

3. Security - With no central point to be exploited the system is protected against hacking attacks and fraud.

4. Immutability - Blocks added to the blockchain can't be tampered.

5. No Intermediary - Peer-to-Peer and business-to-business transactions are completed without the need for a third party.

## How Blockchain Works

Blockchain starts with a single block called genesis block.

<figure class="half">
    <a href="{{ site.url }}/assets/img/2019/06/genesis-block.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2019/06/genesis-block.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2019/06/genesis-block.png">
            <img src="{{ site.url }}/assets/img/2019/06/genesis-block.png" alt="">
        </picture>
    </a>
</figure>

Each block stores the following information:

| Field | Description |
| ------ | ------ |
|Index|Genesis block will have an index of 0.|
|Timestamp|A record of when the block was created. Timestamp helps to keep the blockchain in order.|
|Hash|Digital fingerprint of data. Hash is of fixed length, easy to compute and infeasible to convert back to data.|
|Previous Hash|Hash of the previous block.|
|Data|Each block can store data.|
|Nonce|Number used to find a valid hash.|

We'll explain these with the mining of a new block.

<figure class="half">
    <a href="{{ site.url }}/assets/img/2019/06/mined-block.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2019/06/mined-block.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2019/06/mined-block.png">
            <img src="{{ site.url }}/assets/img/2019/06/mined-block.png" alt="">
        </picture>
    </a>
</figure>

### Index
 
Each new block is given an incremental index value, in this case, it's 1.|

### Timestamp

Block creation timestamp in epoch time, 1560082985.203.

### Hash

SHA256 hash of (index, previous hash, timestamp, data, nonce)

{% highlight bash %}
CryptoJS.SHA256(1 + '0000018035a828da0878ae92ab6fbb16be1ca87a02a3feaa9e3c2b6871931046' 
+ 1560082985.203 + 'HarshadRanganathan' + 29877).toString()

000056f493569b609d6484da94b9031238e80076a8b6a373ae76d3db2746c211
{% endhighlight %}

### Previous Hash

Hash of the previous block which is '0000018035a828da0878ae92ab6fbb16be1ca87a02a3feaa9e3c2b6871931046'.

### Data

Block data.

### Nonce

We start with a nonce of '1' and keep incrementing it until we find a valid hash. 

A Hash is considered to be valid if the number of leading zeros matches the difficulty.

For example, here we have set the difficulty as '4'. We will continue to re-generate the hash until it has 4 leading zeros.

<img src="https://i.imgur.com/Zzo4Ofa.gif" />

As the difficulty increases, the number of possible valid hashes decreases, so it will take more processing power to find a valid hash.

{% include donate.html %}
{% include advertisement.html %}

A new block is added to the blockchain only if it meets the following requirements:

1. New block has a valid index i.e. block index should be greater than latest block index.

2. New block's previous hash is valid i.e. previous hash equals latest block hash.

3. New block has valid hash i.e. it has been correctly calculated.

4. New block's hash meets difficulty requirement.

As the blocks are added and linked using cryptography, they continuously grow the blockchain.

<figure class="half">
    <a href="{{ site.url }}/assets/img/2019/06/blockchain.png">
        <picture>
            <source type="image/webp" srcset="{{ site.url }}/assets/img/2019/06/blockchain.webp">
            <source type="image/png" srcset="{{ site.url }}/assets/img/2019/06/blockchain.png">
            <img src="{{ site.url }}/assets/img/2019/06/blockchain.png" alt="">
        </picture>
    </a>
</figure>

### Immutability

Blockchain provides immutability of records. If an adversary tampers with any of the data in the entire chain,  it will invalidate all the subsequent blocks.

<img src="https://i.imgur.com/41UnNFa.gif" />

Let's assume we have 3 blocks and we want to tamper the data in block #1.

1. If you change the data in block #1 then the SHA256 hash value of the block changes as it is calculated based on the data.

2. Block #2's hash changes as it is based on block #1's hash.

3. Block #3's hash changes as it is based on block #2's hash.

4. Now, all the 3 blocks are invalid as they don't meet the difficulty requirement of having 4 leading zeros.

5. You will then have to mine all the invalidated blocks again by finding new nonce values to make them valid.

This will be a compute intensive and unfeasible operation as the chain continuously grows with new blocks.

{% include donate.html %}
{% include advertisement.html %}

## References

<https://www.npmjs.com/package/blockchain-cli>

<https://blockchaindemo.io>

<https://anders.com/blockchain/blockchain.html>