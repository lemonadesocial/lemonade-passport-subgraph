import { BigInt } from '@graphprotocol/graph-ts'

import { Withdrawn as WithdrawnEvent, Deposited as DepositedEvent } from '../generated/EscrowUpgradeable/EscrowUpgradeable'
import { Referral, Account, Transaction, Escrow } from '../generated/schema'

export function handleWithdrawn(event: WithdrawnEvent): void {
  const escrow = Escrow.load(event.address)!
  // Account should not be null as there must be an account created if someone wants to withdraw
  const account = Account.load(event.transaction.from.toHexString() + '_' + escrow.passport.toHexString())!

  account.claimed += account.unclaimed
  account.claimedAmount = account.claimedAmount.plus(event.params.weiAmount)
  account.unclaimed = 0
  account.unclaimedAmount = BigInt.fromI32(0)

  account.save()
}

export function handleDeposited(event: DepositedEvent): void {
  const transaction = Transaction.load(event.transaction.hash)!
  const escrow = new Escrow(event.address)
  const referral = new Referral(event.transaction.hash.concatI32(event.logIndex.toI32()))
  // Account should not be null as there must be an account created for the referrer (payee)
  const account = Account.load(event.params.payee.toHexString() + '_' + transaction.passport.toHexString())!

  escrow.passport = transaction.passport

  referral.amount = event.params.weiAmount
  referral.referee = transaction.sender
  referral.referrer = event.params.payee
  referral.passport = transaction.passport

  account.unclaimed += 1
  account.unclaimedAmount = account.unclaimedAmount.plus(event.params.weiAmount)

  referral.save()
  account.save()
  escrow.save()
}