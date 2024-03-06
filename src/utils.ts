
import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Account } from "../generated/schema";


/** Fetch an account or create one if it doesn't exist */
export function findOrCreateAccount(address: Address, passport: Address): Account {
  let account = Account.load(address.toHexString() + '_' + passport.toHexString())

  if (account) return account

  account = new Account(address.toHexString() + '_' + passport.toHexString());

  account.claimed = 0;
  account.claimedAmount = BigInt.fromI32(0);
  account.unclaimed = 0;
  account.unclaimedAmount = BigInt.fromI32(0);

  account.save();

  return account;
}
