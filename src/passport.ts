import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  ExecutePurchase as ExecutePurchaseEvent,
  ExecuteReserve as ExecuteReserveEvent,
  Payout as PayoutEvent,
} from "../generated/PassportV1Call/PassportV1Call"
import { Referral, User } from "../generated/schema"

export function handlePurchase(event: ExecutePurchaseEvent): void {
  if (!event.params.success) return

  if (event.params.referrer != Address.zero()) {
    let referral = new Referral(event.transaction.hash)
    let user = User.load(event.params.referrer)

    referral.referrer = event.params.referrer
    referral.incentiveAmount = BigInt.fromI32(0)
    referral.claimed = false

    referral.save()

    if (!user) {
      user = new User(event.params.referrer)

      user.deposit = BigInt.fromI32(0)
      user.referrals = new Array<Bytes>()

      const referrals = user.referrals
      referrals.push(referral.id)

      user.referrals = referrals
    } else {
      user.referrals.push(referral.id)
    }

    user.save()
  }
}

export function handleReserve(event: ExecuteReserveEvent): void {
  if (!event.params.success || !event.params.referred) return

  let referral = new Referral(event.transaction.hash)

  referral.referrer = event.params.sender
  referral.incentiveAmount = BigInt.fromI32(0)
  referral.claimed = false

  referral.save()
}

export function handlePayout(event: PayoutEvent): void {
  let referral = Referral.loadInBlock(event.transaction.hash)

  // The case of reserving passports. Payout directly to sender
  if (referral && event.params.recipient == referral.referrer) {
    referral.incentiveAmount = event.params.amount
    referral.claimed = true
    referral.save()
  }
}
