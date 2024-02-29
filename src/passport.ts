import { Address } from "@graphprotocol/graph-ts"
import {
  ExecutePurchase as ExecutePurchaseEvent
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
    let referral = new Referral(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )

    referral.referrer = event.params.referrer
    referral.passport = entity.id

    referral.save()
  }

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
