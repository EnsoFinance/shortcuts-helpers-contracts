import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {SwapHelpers} from '../../typechain';
import {Contract} from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signers';

describe('EnsoHelpers', async () => {
  describe('SwapHelpers', () => {
    let signer: SignerWithAddress;
    let swapHelpers: SwapHelpers;
    let lido: Contract;

    before(async () => {
      signer = (await ethers.getSigners())[0];
      swapHelpers = <SwapHelpers>await ethers.getContract('SwapHelpers');
      lido = new Contract('0xae7ab96520de3a18e5e111b5eaab095312d7fe84', [
        'function balanceOf(address) external view returns (uint256)',
        'function approve(address,uint256) external',
        'function submit(address) external payable'
      ], signer)
    });

    it('has VERSION', async () => {
      const currentVersion = 2n;
      expect(await swapHelpers.VERSION()).to.eq(currentVersion);
    });

    it('insert amount', async () => {
      const data = '0xd9627aa40000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ec3d6000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const index = 1;
      const amount = '1001000000000000000';

      const newData = await swapHelpers.insertAmount(data, index, amount);

      const expectedData = '0xd9627aa400000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000de444324c2a800000000000000000000000000000000000000000000000000000000000000ec3d6000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      expect(newData).to.eq(expectedData);
    });

    it('swap from ETH', async () => {
      if (await signer.getChainId() === 1) {
        let amount = '100000000000000000000';
        const balanceBefore = await lido.balanceOf(signer.address);
        await swapHelpers.swap(
          '0x1111111254eeb25477b68fb85ed929f73a960582',
          '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          lido.address,
          amount,
          signer.address,
          `0x12aa3caf000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000ae7ab96520de3a18e5e111b5eaab095312d7fe84000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09${ethers.utils.hexZeroPad(swapHelpers.address, 32).substring(2)}00000000000000000000000000000000000000000000000000038d7ea4c6800100000000000000000000000000000000000000000000000000037235b96e9fff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f60000000000000000000000000000000000000000000000000000d80000aa00a007e5c0d200000000000000000000000000000000000000008600006c00003000001640607f39c581f595b53c5cb19bd0b3f8da6c935e2ca00020d6bdbf787f39c581f595b53c5cb19bd0b3f8da6c935e2ca041207f39c581f595b53c5cb19bd0b3f8da6c935e2ca00004de0e9a3e00000000000000000000000000000000000000000000000000000000000000000020d6bdbf78ae7ab96520de3a18e5e111b5eaab095312d7fe8480a06c4eca27ae7ab96520de3a18e5e111b5eaab095312d7fe841111111254eeb25477b68fb85ed929f73a96058200000000000000000000d5504337`,
          '5',
          { value: amount }
        )
        const balanceAfter = await lido.balanceOf(signer.address);
        expect(balanceAfter.sub(balanceBefore)).gt(0);
      }
    })

    it('swap to ETH', async () => {
      if (await signer.getChainId() === 1) {
        let amount = '100000000000000000000';
        await lido.submit(ethers.constants.AddressZero, { value: amount });
        amount = await lido.balanceOf(signer.address);
        await lido.approve(swapHelpers.address, amount);
        const balanceBefore = await signer.getBalance();
        await swapHelpers.swap(
          '0x1111111254eeb25477b68fb85ed929f73a960582',
          lido.address,
          '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          amount,
          signer.address,
          `0x12aa3caf000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09000000000000000000000000ae7ab96520de3a18e5e111b5eaab095312d7fe84000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000e37e799d5077682fa0a244d46e5649f71457bd09${ethers.utils.hexZeroPad(swapHelpers.address, 32).substring(2)}0000000000000000000000000000000000000000000000008ac7230489e8000000000000000000000000000000000000000000000000000086942f62bb1166fb000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ea0000000000000000000000000000000000000000000000cc0000b60000b05120dc24316b9ae028f1497c275eb9192a3ea0f67022ae7ab96520de3a18e5e111b5eaab095312d7fe8400443df0212400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000086942f62bb1166fb00206b4be0b9c0611111111254eeb25477b68fb85ed929f73a96058200000000000000000000000000000000000000000000d5504337000000000000000000000000000000000000000000000000`,
          '5',
        )
        const balanceAfter = await signer.getBalance();
        expect(balanceAfter.sub(balanceBefore)).gt(0);
      }
    })
  });
});
