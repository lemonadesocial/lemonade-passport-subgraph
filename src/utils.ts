
import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Account } from "../generated/schema";


export function createAccount(address: Address, passport: Address): Account {
  const account = new Account(address.toHexString() + '_' + passport.toHexString());

  account.claimed = 0;
  account.claimedAmount = BigInt.fromI32(0);
  account.unclaimed = 0;
  account.unclaimedAmount = BigInt.fromI32(0);

  account.save();

  return account;
}
