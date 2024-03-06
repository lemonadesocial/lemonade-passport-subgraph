import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Withdrawn as WithdrawnEvent, Deposited as DepositedEvent } from '../generated/EscrowUpgradeable/EscrowUpgradeable'
import { Referral, Transaction, Escrow } from '../generated/schema'

import { findOrCreateAccount } from './utils'

export function handleWithdrawn(event: WithdrawnEvent): void {
  const escrow = Escrow.load(event.address)!
  const account = findOrCreateAccount(Address.fromBytes(escrow.passport), event.transaction.from)

  account.claimedCount += account.unclaimedCount
  account.claimedAmount = account.claimedAmount.plus(event.params.weiAmount)
  account.unclaimedCount = 0
  account.unclaimedAmount = BigInt.fromI32(0)

  account.save()
}

export function handleDeposited(event: DepositedEvent): void {
  const transaction = Transaction.load(event.transaction.hash)!
  const escrow = new Escrow(event.address)
  const referral = new Referral(event.transaction.hash.concatI32(event.logIndex.toI32()))
  const account = findOrCreateAccount(Address.fromBytes(transaction.passport), event.params.payee)

  escrow.passport = transaction.passport

  referral.amount = event.params.weiAmount
  referral.referee = transaction.sender
  referral.referrer = event.params.payee
  referral.passport = transaction.passport

  account.unclaimedCount += 1
  account.unclaimedAmount = account.unclaimedAmount.plus(event.params.weiAmount)

  referral.save()
  account.save()
  escrow.save()
}