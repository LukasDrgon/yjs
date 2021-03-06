import { getReference } from './structReferences.js'

export const RootFakeUserID = 0xFFFFFF

export default class RootID {
  constructor (name, typeConstructor) {
    this.user = RootFakeUserID
    this.name = name
    this.type = getReference(typeConstructor)
  }
  equals (id) {
    return id !== null && id.user === this.user && id.name === this.name && id.type === this.type
  }
  lessThan (id) {
    return this.user < id.user || (this.user === id.user && (this.name < id.name || (this.name === id.name && this.type < id.type)))
  }
}
