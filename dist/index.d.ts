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
type GeoJson = GeoJSON;
type GeoJsonWithCrs = GeoJson & {
    crs: Crs;
};
declare const normalize: (object: GeoJson | GeoJsonWithCrs) => GeoJson;
declare const obsolete: (object: GeoJson, projection?: string, datum?: string) => GeoJsonWithCrs;
export { normalize, obsolete, };
