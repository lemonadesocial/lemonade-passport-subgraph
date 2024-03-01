import { BigInt } from "@graphprotocol/graph-ts"
import {
  ExecutePurchase as ExecutePurchaseEvent,
  ExecuteReserve as ExecuteReserveEvent,
  Payout as PayoutEvent,
} from "../generated/PassportV1Call/PassportV1Call"
import { Referral, Account } from "../generated/schema"

export function handlePurchase(event: ExecutePurchaseEvent): void {
  if (!event.params.success) return

  const account = new Account(event.params.sender)

  account.passport = event.address
  account.claimed = 0
  account.claimedAmount = BigInt.fromI32(0)
  account.unclaimed = 0
  account.unclaimedAmount = BigInt.fromI32(0)

  account.save()
}

export function handleReserve(event: ExecuteReserveEvent): void {
  if (!event.params.success) return

  const account = new Account(event.params.sender)

  account.passport = event.address
  account.claimed = 0
  account.claimedAmount = BigInt.fromI32(0)
  account.unclaimed = 0
  account.unclaimedAmount = BigInt.fromI32(0)

  account.save()
}

export function handlePayout(event: PayoutEvent): void {
  let referral = new Referral(event.transaction.hash.concatI32(event.logIndex.toI32()))
  let account = Account.load(event.params.recipient)

  if (!account) return

  referral.amount = event.params.amount
  referral.referee = event.params.recipient
  referral.referrer = event.params.recipient
  referral.passport = event.address

  account.claimed += 1
  account.claimedAmount = account.claimedAmount.plus(event.params.amount)

  referral.save()
  account.save()
}
