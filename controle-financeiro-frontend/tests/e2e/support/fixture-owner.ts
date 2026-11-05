import {syntheticUser,type SyntheticUser} from './synthetic-auth';

export type FixtureOwner = 'frontend-closure' | 'rf15-surfaces' | 'cf015-native-zoom' | 'rf15-native-chrome';

// Spec ownership is deterministic; reload/login reuse the same identity.
export function fixtureUser(alias:SyntheticUser['alias'],namespace:string,owner:FixtureOwner,scenario:string):SyntheticUser {
  return syntheticUser(alias,namespace+'-'+owner+'-'+scenario);
}
