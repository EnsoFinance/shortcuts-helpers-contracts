import {Contract, Signer} from 'ethers';
import {ethers, deployments, getNamedAccounts, getUnnamedAccounts, network} from 'hardhat';
import {EnsoShortcutsHelpers, TupleHelpers} from '../../typechain';

const OWNER_SLOT = '0xebef2b212afb6c9cfdbd10b61834a8dc955e5fbf0aacd1c641d5cbdedf4022d0';
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

export async function setupUsers<T extends {[contractName: string]: Contract}>(
  addresses: string[],
  contracts: T
): Promise<({address: string} & T)[]> {
  const users: ({address: string} & T)[] = [];
  for (const address of addresses) {
    users.push(await setupUser(address, contracts));
  }
  return users;
}

export async function setupUser<T extends {[contractName: string]: Contract}>(
  address: string,
  contracts: T
): Promise<{address: string} & T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = {address};
  for (const key of Object.keys(contracts)) {
    user[key] = contracts[key].connect(await ethers.getSigner(address));
  }

  return user as {address: string} & T;
}

export const setup = deployments.createFixture(async () => {
  const contracts = {
    EnsoShortcutsHelpers: <EnsoShortcutsHelpers>await ethers.getContract('EnsoShortcutsHelpers'),
    TupleHelpers: <TupleHelpers>await ethers.getContract('TupleHelpers'),
  };

  const users = await setupUsers(await getUnnamedAccounts(), contracts);

  return {
    contracts,
    users,
  };
});

export async function impersonateAccount(address: string): Promise<Signer> {
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });

  const signer = await ethers.getSigner(address);

  return signer;
}
