import { BigInt, Bytes } from '@graphprotocol/graph-ts'

import { Withdrawn as WithdrawnEvent, Deposited as DepositedEvent } from '../generated/EscrowUpgradeable/EscrowUpgradeable'
import { Referral, User } from '../generated/schema'

export function handleWithdrawn(event: WithdrawnEvent): void {
    let user = User.load(event.params.payee)

    if (!user) return

    user.referrals.forEach(referral => {
        let entity = Referral.load(referral)

        if (!entity) return

        entity.claimed = true

        entity.save()
    });
    user.deposit = BigInt.fromI32(0)

    user.save()
}

export function handleDeposited(event: DepositedEvent): void {
    let user = User.load(event.params.payee)
    const referral = Referral.loadInBlock(event.transaction.hash)

    if (!user) {
        user = new User(event.params.payee)

        user.deposit = BigInt.fromI32(0)
        user.referrals = new Array<Bytes>()
    }

    user.deposit = user.deposit.plus(event.params.weiAmount)

    if (!referral) return

    if (event.params.payee == referral.referrer) {
        referral.incentiveAmount = event.params.weiAmount
    }

    user.save()
    referral.save()
}