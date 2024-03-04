import { BigInt } from '@graphprotocol/graph-ts'

import { Withdrawn as WithdrawnEvent, Deposited as DepositedEvent } from '../generated/EscrowUpgradeable/EscrowUpgradeable'
import { Referral, Account } from '../generated/schema'

export function handleWithdrawn(event: WithdrawnEvent): void {
    let account = Account.load(event.params.payee)

    if (!account) return

    account.claimed += account.unclaimed
    account.claimedAmount = account.claimedAmount.plus(event.params.weiAmount)
    account.unclaimed = 0
    account.unclaimedAmount = BigInt.fromI32(0)

    account.save()
}

export function handleDeposited(event: DepositedEvent): void {
    const referral = new Referral(event.transaction.hash.concatI32(event.logIndex.toI32()))
    const account = Account.load(event.params.payee)

    if (!account) return

    referral.amount = event.params.weiAmount
    referral.referee = event.transaction.from
    referral.referrer = event.params.payee
    referral.passport = event.transaction.to!

    account.unclaimed += 1
    account.unclaimedAmount = account.unclaimedAmount.plus(event.params.weiAmount)

    referral.save()
    account.save()
}