import { Address } from "@graphprotocol/graph-ts"

import {
  ExecutePurchase as ExecutePurchaseEvent,
  ExecuteReserve as ExecuteReserveEvent,
  Reserve as ReserveEvent,
  Payout as PayoutEvent,
} from "../generated/PassportV1Call/PassportV1Call"
import { Referral, Transaction, Reservation } from "../generated/schema"

import { findOrCreateAccount, incrementStatistics } from "./utils"

export function handlePurchase(event: ExecutePurchaseEvent): void {
  if (!event.params.success) return

  const transaction = new Transaction(event.transaction.hash)

  transaction.sender = event.params.sender
  transaction.referrer = event.params.referrer
  transaction.passport = event.address

  transaction.save()
}

export function handleExecuteReserve(event: ExecuteReserveEvent): void {
  if (!event.params.success) return

  const transaction = new Transaction(event.transaction.hash)
  const reservation = Reservation.load(event.address.toHexString() + "_" + event.params.paymentId.toString())

  transaction.sender = event.params.sender
  transaction.referred = event.params.referred
  transaction.passport = event.address
  transaction.reservationCount = reservation ? reservation.count : 0

  transaction.save()
}

export function handleReserve(event: ReserveEvent): void {
  const reservation = new Reservation(event.address.toHexString() + "_" + event.params.paymentId.toString())

  reservation.count = event.params.assignments.length
  
  reservation.save()
}

export function handlePayout(event: PayoutEvent): void {
  const transaction = Transaction.load(event.transaction.hash)

  if (!transaction || transaction.sender != event.params.recipient) return

  const account = findOrCreateAccount(Address.fromBytes(transaction.passport), Address.fromBytes(transaction.sender))
  const effectiveCount = transaction.reservationCount || 1

  account.claimedCount += effectiveCount
  account.claimedAmount = account.claimedAmount.plus(event.params.amount)
  account.totalCount += effectiveCount
  account.totalAmount = account.totalAmount.plus(event.params.amount)

  account.save()

  const referral = new Referral(event.transaction.hash.concatI32(event.logIndex.toI32()))

  referral.amount = event.params.amount
  referral.referee = event.params.recipient
  referral.referrer = event.params.recipient
  referral.passport = transaction.passport

  referral.save()

  incrementStatistics(Address.fromBytes(transaction.passport), effectiveCount, event.params.amount)
}
