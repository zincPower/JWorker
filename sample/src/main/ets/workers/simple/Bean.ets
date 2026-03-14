export interface User {
  name: string
  year: number
  height: number
  address: Address
}

export interface Address {
  country: string
  province: string
  city: string
}