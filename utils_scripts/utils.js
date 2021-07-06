import {
  bigNumberify,
} from 'ethers/utils'


export function expandTo18Decimals(n) {
    return bigNumberify(n).mul(bigNumberify(10).pow(18))
}