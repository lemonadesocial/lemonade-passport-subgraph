import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  ExecutePurchase as ExecutePurchaseEvent,
  Payout as PayoutEvent,
} from "../generated/PassportV1Call/PassportV1Call"
import { Passport, Referral } from "../generated/schema"

export function handlePurchase(event: ExecutePurchaseEvent): void {
  if (!event.params.success) return

  let entity = new Passport(
    event.address.toHexString() + '_' + event.params.tokenId.toString()
  )

  entity.owner = event.params.sender
  entity.paymentId = event.params.paymentId

  if (event.params.referrer != Address.zero()) {
    let referral = new Referral(event.transaction.hash)

    referral.referrer = event.params.referrer
    referral.incentiveAmount = BigInt.fromI32(0);

    referral.save()
  }

  entity.save()
}

export function handlePayout(event: PayoutEvent): void {
  let referral = Referral.loadInBlock(event.transaction.hash)

  if (referral) {
    referral.incentiveAmount = event.params.amount
    referral.save()
  }
}
