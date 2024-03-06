import { Address } from "@graphprotocol/graph-ts"

import {
  ExecutePurchase as ExecutePurchaseEvent,
  ExecuteReserve as ExecuteReserveEvent,
  Payout as PayoutEvent,
} from "../generated/PassportV1Call/PassportV1Call"
import { Referral, Account, Transaction } from "../generated/schema"

import { createAccount } from "./utils"

export function handlePurchase(event: ExecutePurchaseEvent): void {
  if (!event.params.success) return

  const transaction = new Transaction(event.transaction.hash)

  transaction.sender = event.params.sender
  transaction.referrer = event.params.referrer
  transaction.passport = event.address
  
  transaction.save()
}

export function handleReserve(event: ExecuteReserveEvent): void {
  if (!event.params.success) return

  const transaction = new Transaction(event.transaction.hash)

  transaction.sender = event.params.sender
  transaction.referred = event.params.referred
  transaction.passport = event.address
  
  transaction.save()
}

export function handlePayout(event: PayoutEvent): void {
  const transaction = Transaction.load(event.transaction.hash)

  if (!transaction || (!transaction.referred && !transaction.referrer)) return

  const referral = new Referral(event.transaction.hash.concatI32(event.logIndex.toI32()))
  let account = Account.load(transaction.sender.toHexString() + '_' + transaction.passport.toHexString())

  if (!account) {
    account = createAccount(Address.fromBytes(transaction.sender), Address.fromBytes(transaction.passport))
  }

  referral.amount = event.params.amount
  referral.referee = event.params.recipient
  referral.referrer = event.params.recipient
  referral.passport = transaction.passport

  account.claimed += 1
  account.claimedAmount = account.claimedAmount.plus(event.params.amount)

  referral.save()
  account.save()
}
