import { GeoJSON } from 'geojson';
type CrsType = 'name' | 'link';
type CrsLinkType = 'proj4' | 'ogcwkt' | 'esriwkt';
interface CrsNamed {
    name: string;
}
interface CrsLinked {
    href: string;
    type?: CrsLinkType;
}
interface Crs {
    type: CrsType;
    properties: CrsNamed | CrsLinked;
}
type GeoJSONWithCrs = GeoJSON & {
    crs: Crs;
};
declare const normalize: (object: GeoJSON | GeoJSONWithCrs) => GeoJSON;
declare const obsolete: (object: GeoJSON, projection?: string, datum?: string) => GeoJSONWithCrs;
export { normalize, obsolete, };
