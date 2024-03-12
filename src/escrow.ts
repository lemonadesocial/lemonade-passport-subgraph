import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Withdrawn as WithdrawnEvent, Deposited as DepositedEvent } from '../generated/EscrowUpgradeable/EscrowUpgradeable'
import { Referral, Transaction, Escrow } from '../generated/schema'

import { findOrCreateAccount, incrementStatistics } from './utils'

export function handleWithdrawn(event: WithdrawnEvent): void {
  const escrow = Escrow.load(event.address)

  if (!escrow) return

  const account = findOrCreateAccount(Address.fromBytes(escrow.passport), event.transaction.from)

  account.claimedCount += account.unclaimedCount
  account.claimedAmount = account.claimedAmount.plus(event.params.weiAmount)
  account.unclaimedCount = 0
  account.unclaimedAmount = BigInt.fromI32(0)

  account.save()
}

export function handleDeposited(event: DepositedEvent): void {
  const transaction = Transaction.load(event.transaction.hash)

  if (!transaction) return

  if (!Escrow.load(event.address)) {
    const escrow = new Escrow(event.address)

    escrow.passport = transaction.passport

    escrow.save()
  }

  const referral = new Referral(event.transaction.hash.concatI32(event.logIndex.toI32()))

  referral.amount = event.params.weiAmount
  referral.referee = transaction.sender
  referral.referrer = event.params.payee
  referral.passport = transaction.passport

  referral.save()

  const account = findOrCreateAccount(Address.fromBytes(transaction.passport), event.params.payee)

  account.unclaimedCount += 1
  account.unclaimedAmount = account.unclaimedAmount.plus(event.params.weiAmount)
  account.totalCount += 1
  account.totalAmount = account.totalAmount.plus(event.params.weiAmount)

  account.save()

  incrementStatistics(1, event.params.weiAmount)
}
