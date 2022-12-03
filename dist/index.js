"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obsolete = exports.normalize = void 0;
const proj4_1 = __importDefault(require("proj4"));
// EPSG:4326 (WGS 84, latitude/longitude coordinate system based on the Earth's center of mass,
// used by the Global Positioning System among others)
const geoJSONProjection = 'EPSG:4326';
// EPSG:3857 (Web Mercator projection used for display by many web-based mapping tools,
// including Google Maps and OpenStreetMap)
const geoJSONObsoleteDefaultProjection = 'EPSG:3857';
const parseProjectionFromUrn = (urn) => {
    // urn:ogc:def:objectType:EPSG:version:code
    // https://portal.ogc.org/files/?artifact_id=24045
    const patternRegexp = /^urn:ogc:def:crs:EPSG:(\d+)?:(\d+)$/;
    const matches = urn.match(patternRegexp);
    if (matches) {
        return `EPSG:${matches[2]}`;
    }
};
const getProjectionNameFromCrs = (object) => {
    if (object.crs.type === 'name') {
        return parseProjectionFromUrn(object.crs.properties.name);
    }
};
const convertProjections = (object, fromProjection, toProjection) => {
    const isPositionCoordinate = (coordinates) => {
        return coordinates.length >= 2 && coordinates.every((coordinate) => {
            return typeof coordinate === 'number';
        });
    };
    const translateCoordinates = (coordinates) => {
        if (isPositionCoordinate(coordinates)) {
            return (0, proj4_1.default)(fromProjection, toProjection, coordinates);
        }
        else {
            return coordinates.map(translateCoordinates);
        }
    };
    const proceedFeatureCollection = (featureCollection) => {
        const proceedGeometry = (geometry) => {
            geometry.coordinates = translateCoordinates(geometry.coordinates);
            return geometry;
        };
        const proceedGeometryCollection = (collection) => {
            collection.geometries = collection.geometries.map(proceedGeometry);
            return collection;
        };
        const proceedFeature = (feature) => {
            if (feature.geometry.type === 'GeometryCollection') {
                feature.geometry = proceedGeometryCollection(feature.geometry);
            }
            else {
                feature.geometry = proceedGeometry(feature.geometry);
            }
            return feature;
        };
        featureCollection.features = featureCollection.features.map(proceedFeature);
        return featureCollection;
    };
    if (object.type === 'FeatureCollection') {
        object = proceedFeatureCollection(object);
    }
    return object;
};
const normalizeGeoJSONObsolete = (object) => {
    const detectedProjection = getProjectionNameFromCrs(object);
    if (!detectedProjection) {
        throw 'Can\'t detect projection for GeoJSON';
    }
    delete object.crs;
    return convertProjections(object, detectedProjection, geoJSONProjection);
};
const normalize = (object) => {
    if ('crs' in object) {
        return normalizeGeoJSONObsolete(object);
    }
    return object;
};
exports.normalize = normalize;
const obsolete = (object, projection, datum) => {
    const crsProjection = projection || geoJSONObsoleteDefaultProjection;
    if (projection && datum) {
        proj4_1.default.defs(projection, datum);
    }
    const convertedObject = convertProjections(object, geoJSONProjection, crsProjection);
    const projectionCode = crsProjection.split(':').pop();
    return Object.assign(Object.assign({}, convertedObject), { crs: {
            type: 'name',
            properties: {
                name: `urn:ogc:def:crs:EPSG::${projectionCode}`,
            },
        } });
};
exports.obsolete = obsolete;
