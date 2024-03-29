
import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Account, Statistic } from "../generated/schema";

const ZERO_ADDRESS = Address.zero()

/** Fetch an account or create one if it doesn't exist */
export function findOrCreateAccount(passport: Address, address: Address): Account {
  let account = Account.load(passport.toHexString() + '_' + address.toHexString())

  if (account) return account

  account = new Account(passport.toHexString() + '_' + address.toHexString());

  account.claimedCount = 0;
  account.claimedAmount = BigInt.fromI32(0);
  account.unclaimedCount = 0;
  account.unclaimedAmount = BigInt.fromI32(0);
  account.totalCount = 0;
  account.totalAmount = BigInt.fromI32(0);

  account.save();

  return account;
}

export function incrementStatistics(passport: Address, referralCount: i32, referralAmount: BigInt): void {
  let statistic = Statistic.load(passport)

  if (!statistic) {
    statistic = new Statistic(passport);
    statistic.totalReferralCount = 0;
    statistic.totalReferralAmount = BigInt.fromI32(0);
  }

  statistic.totalReferralCount += referralCount
  statistic.totalReferralAmount = statistic.totalReferralAmount.plus(referralAmount)

  statistic.save()

  let globalStatistic = Statistic.load(ZERO_ADDRESS)

  if (!globalStatistic) {
    globalStatistic = new Statistic(ZERO_ADDRESS);
    globalStatistic.totalReferralCount = 0;
    globalStatistic.totalReferralAmount = BigInt.fromI32(0);
  }

  globalStatistic.totalReferralCount += referralCount
  globalStatistic.totalReferralAmount = globalStatistic.totalReferralAmount.plus(referralAmount)

  globalStatistic.save()
}
