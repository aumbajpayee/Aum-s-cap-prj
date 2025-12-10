import React from 'react'
import Link from 'next/link'
import { formatAmount } from '@/lib/utils'
import Image from 'next/image'

const BankCard = ({ account, userName, showBalance = true }: CreditCardProps) => {
  return (
    <div className="flex flex-col">
      <Link href="/" className="bank-card relative">
        <div className="bank-card_content flex flex-col justify-between h-full p-4">
          {/* Name on Top */}
          <h1 className="text-white text-lg font-bold">
            {account.name || userName}
          </h1>

          {/* Balance Below Name */}
            <p className="text-white text-xl font-semibold mt-2">
              {formatAmount(account.currentBalance)}
            </p>

          {/* Bottom Section: User Name & Card Mask */}
          <article className="mt-auto pt-2">
            <div className="flex justify-between text-white text-sm font-semibold">
              <h1>{userName}</h1>
              <h2>** / **</h2>
              <p className="text-14 font-semibold tracking-[1.1px] text-white">
                **** **** **** <span className="text-16">{account.mask}</span>
            </p>
            </div>
          </article>
        </div>
        <div className="bank-card_icon">
            <Image
                src="/icons/Paypass.svg"
                width={20}
                height={24}
                alt="pay"
            />
            <Image
                src="/icons/mastercard.svg"
                width={45}
                height={32}
                alt="mastercard"

            />
            <Image
                src="/icons/lines.png"
                width={316}
                height={190}
                alt="lines"
                className="absolute top-0 left-0"

            />
        </div>
      </Link>
    </div>
  )
}

export default BankCard
