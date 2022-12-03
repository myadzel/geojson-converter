import proj4 from 'proj4';
import {
    Feature, FeatureCollection, GeoJSON, Polygon, Position, Point,
    MultiLineString, MultiPolygon, MultiPoint, LineString, GeometryCollection
} from 'geojson';


type FeatureGeometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;

type CrsType = 'name' | 'link';

type CrsLinkType = 'proj4' | 'ogcwkt' | 'esriwkt';

interface CrsNamed {
    name: string,
}

interface CrsLinked {
    href: string,
    type?: CrsLinkType,
}

interface Crs {
    type: CrsType,
    properties: CrsNamed | CrsLinked,
}

type GeoJson = GeoJSON;

// GeoJSON with coordinate reference system
// https://web.archive.org/web/20160827120507/http://geojson.org/geojson-spec.html
type GeoJsonWithCrs = GeoJson & {
    crs: Crs,
}

// EPSG:4326 (WGS 84, latitude/longitude coordinate system based on the Earth's center of mass,
// used by the Global Positioning System among others)
const geoJsonProjection = 'EPSG:4326';

// EPSG:3857 (Web Mercator projection used for display by many web-based mapping tools,
// including Google Maps and OpenStreetMap)
const geoJsonWithCrsDefaultProjection = 'EPSG:3857';

const parseProjectionFromUrn = (urn: string) => {
    // urn:ogc:def:objectType:EPSG:version:code
    // https://portal.ogc.org/files/?artifact_id=24045
    const patternRegexp = /^urn:ogc:def:crs:EPSG:(\d+)?:(\d+)$/;

    const matches = urn.match(patternRegexp);

    if (matches) {
        return `EPSG:${matches[2]}`;
    }
};

const getProjectionNameFromCrs = (object: GeoJsonWithCrs): string | undefined => {
    if (object.crs.type === 'name') {
        return parseProjectionFromUrn((object.crs.properties as CrsNamed).name);
    }
};

const convertProjections = (object: GeoJson | GeoJsonWithCrs, fromProjection: string, toProjection: string) => {
    const isPositionCoordinate = (coordinates: Position) => {
        return coordinates.length >= 2 && coordinates.every((coordinate: Number) => {
            return typeof coordinate === 'number';
        });
    };

    const translateCoordinates = (coordinates: Position | Position[] | Position[][] | Position[][][]) => {
        if (isPositionCoordinate(coordinates as Position)) {
            return proj4(fromProjection, toProjection, coordinates as Position);
        } else {
            return (coordinates as Position[]).map(translateCoordinates);
        }
    };

    const proceedFeatureCollection = (featureCollection: FeatureCollection) => {
        const proceedGeometry = (geometry: FeatureGeometry) => {
            geometry.coordinates = translateCoordinates(geometry.coordinates);

            return geometry;
        };

        const proceedGeometryCollection = (collection: GeometryCollection) => {
            collection.geometries = collection.geometries.map(proceedGeometry);

            return collection;
        };

        const proceedFeature = (feature: Feature) => {
            if (feature.geometry.type === 'GeometryCollection') {
                feature.geometry = proceedGeometryCollection(feature.geometry as GeometryCollection);
            } else {
                feature.geometry = proceedGeometry(feature.geometry as FeatureGeometry);
            }

            return feature;
        };

        featureCollection.features = featureCollection.features.map(proceedFeature);

        return featureCollection;
    };

    if (object.type === 'FeatureCollection') {
        object = proceedFeatureCollection(object as FeatureCollection);
    }

    return object;
};

const normalizeGeoJsonWithCrs = (object: GeoJsonWithCrs) => {
    const detectedProjection = getProjectionNameFromCrs(object);

    if (!detectedProjection) {
        throw 'Can\'t detect projection for GeoJSON';
    }

    delete object.crs;

    return convertProjections(object, detectedProjection, geoJsonProjection);
};

const normalize = (object: GeoJson | GeoJsonWithCrs): GeoJson => {
    if ('crs' in object) {
        return normalizeGeoJsonWithCrs(object as GeoJsonWithCrs);
    }

    return object;
};

const obsolete = (object: GeoJson, projection?: string, datum?: string) => {
    const crsProjection = projection || geoJsonWithCrsDefaultProjection;

    if (projection && datum) {
        proj4.defs(projection, datum);
    }

    const convertedObject = convertProjections(object, geoJsonProjection, crsProjection);

    const projectionCode = crsProjection.split(':').pop();

    return {
        ...convertedObject,
        crs: {
            type: 'name',
            properties: {
                name: `urn:ogc:def:crs:EPSG::${projectionCode}`,
            },
        },
    } as GeoJsonWithCrs;
};

export {
    normalize,
    obsolete,
};
