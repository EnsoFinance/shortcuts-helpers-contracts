import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {BalancerHelpers} from '../../typechain';
import {utils} from 'ethers/';

describe('EnsoHelpers', async () => {
  describe('BalancerHelpers', () => {
    let balancerHelpers: BalancerHelpers;

    before(async () => {
      balancerHelpers = <BalancerHelpers>await ethers.getContract('BalancerHelpers');
    });

    it('has VERSION', async () => {
      const currentVersion = 2n;
      expect(await balancerHelpers.VERSION()).to.eq(currentVersion);
    });

    it('encode exact tokens join', async () => {
      const joinKind = 1;
      const amounts = [0, 100000000];
      const minAmountOut = 0;

      const userDataABI = ['uint256', 'uint256[]', 'uint256'];
      const userData = [joinKind, amounts, minAmountOut];
      const encodedUserData = utils.defaultAbiCoder.encode(userDataABI, userData);

      expect(await balancerHelpers.encodeDataForJoinKindOne(joinKind, amounts, minAmountOut)).to.eq(encodedUserData);
    });

    it('encode exact token exit', async () => {
      const exitKind = 0;
      const amount = 100000000;
      const tokenIndex = 0;

      const userDataABI = ['uint256', 'uint256', 'uint256'];
      const userData = [exitKind, amount, tokenIndex];
      const encodedUserData = utils.defaultAbiCoder.encode(userDataABI, userData);

      expect(await balancerHelpers.encodeDataForExitKindZero(exitKind, amount, tokenIndex)).to.eq(encodedUserData);
    });
  });
});
