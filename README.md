# Smart Copyright

### Install project
- Install solc
- Install web3j

### Compile sol to java lib
- Compile file sol to abi and bin file
`solc NFTToken.sol --bin --abi --optimize -o compile`
- Compile to java lib from abi and bin file
`web3j generate solidity -a ./compile/NFTToken.abi -b ./compile/NFTToken.bin -o java -p bap.jp`