import type {FactDocument,SecurityIdentity,VerifiedValue,Quote,MarketCap,PriceRange,Business} from '../domain/stock.js';
export interface StockProvider {
 resolve(symbol:string,market:string):Promise<SecurityIdentity>;
 getQuote(identity:SecurityIdentity):Promise<VerifiedValue<Quote>>;
 getMarketCap(identity:SecurityIdentity):Promise<VerifiedValue<MarketCap>>;
 get52WeekRange(identity:SecurityIdentity):Promise<VerifiedValue<PriceRange>>;
 getBusinessSegments(identity:SecurityIdentity):Promise<VerifiedValue<Business>>;
 getDocument():Promise<FactDocument>;
}
export interface Evidence {evidenceId:string;relativePath:string;sourceUrl:string;sha256:string;retrievedAt:string;licenseNote:string;factIds:string[]}
export interface SourceHints {
 schemaVersion:1;
 provider:{kind:'reviewed_file';relativePath:string;sha256:string;permission:{status:'approved';basis:string}};
 officialSite:{url:string;hostname:string;selector:string;requiredLabels:string[];issuerName:string;verificationUrl:string;licenseNote:string};
 evidence:Evidence[];
 review:{status:'pending'|'approved';reviewedBy:string;reviewedAt:string;basisFingerprint:string};
 concept?:{kind:'reviewed_import';relativePath:string;sha256:string;model:string;prompt:string;generatedAt:string;licenseNote:string;reviewStatus:'approved'};
}
