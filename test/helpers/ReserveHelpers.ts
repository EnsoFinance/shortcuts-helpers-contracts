import {expect} from '../chai-setup';
import {ethers, getNamedAccounts} from 'hardhat';
import {ReserveHelpers} from '../../typechain';
import {BigNumber, Contract, constants} from 'ethers';

describe('EnsoHelpers', async () => {
  describe('ReserveHelpers', () => {
    let reserveHelpers: ReserveHelpers;

    before(async () => {
      reserveHelpers = <ReserveHelpers>await ethers.getContract('ReserveHelpers');
    });

    it('Max issuable', async () => {
      console.log('Reserve address: ', reserveHelpers.address)
      const rtoken = new Contract("0xE72B141DF173b999AE7c1aDcbF60Cc9833Ce56a8", ["function main() external view returns (address)"], await ethers.getNamedSigner('deployer'))
      const facade = new Contract("0x2C7ca56342177343A2954C250702Fd464f4d0613", ["function maxIssuableByAmounts(address,uint256[]) external returns (uint256)"], await ethers.getNamedSigner('deployer'))
      //const resp = await facade.callStatic.maxIssuableByAmounts("0xE72B141DF173b999AE7c1aDcbF60Cc9833Ce56a8",  ["96000000000000000", "110000000000000000"])
      //console.log('Resp: ', resp)
      const response = await reserveHelpers.callStatic.maxIssuableByAmounts("0xE72B141DF173b999AE7c1aDcbF60Cc9833Ce56a8");
      console.log('Response: ', response)
    });
  });
});
