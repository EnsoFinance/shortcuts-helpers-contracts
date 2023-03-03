import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {DecimalHelpers} from '../../typechain';

describe('EnsoHelpers', async () => {
  describe('DecimalHelpers', () => {
    let decimalHelpers: DecimalHelpers;

    before(async () => {
      decimalHelpers = <DecimalHelpers>await ethers.getContract('DecimalHelpers');
    });

    it('has VERSION', async () => {
      const currentVersion = 1n;
      expect(await decimalHelpers.VERSION()).to.eq(currentVersion);
    });

    it('decimalString', async () => {
      const number = 1000;
      const decimals = 4;
      const res = await decimalHelpers.decimalString(number, decimals, false);

      expect(await decimalHelpers.decimalString(number, decimals, false)).to.eq('0.1');
    });

  });
});
