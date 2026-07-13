import { create } from "@bufbuild/protobuf";
import { TimestampSchema } from "@bufbuild/protobuf/wkt";

import { PlacementRefsSchema } from "@/protoFleet/api/generated/common/v1/common_pb";
import {
  type Measurement,
  MeasurementSchema,
  MeasurementUnit,
} from "@/protoFleet/api/generated/common/v1/measurement_pb";
import {
  DeviceStatus,
  type MinerStateSnapshot,
  MinerStateSnapshotSchema,
  PairingStatus,
} from "@/protoFleet/api/generated/fleetmanagement/v1/fleetmanagement_pb";
import { TemperatureStatus } from "@/protoFleet/api/generated/telemetry/v1/telemetry_pb";

const nowSec = () => BigInt(Math.floor(Date.now() / 1000));

const measurement = (value: number, unit: MeasurementUnit): Measurement =>
  create(MeasurementSchema, {
    value,
    unit,
    timestamp: create(TimestampSchema, { seconds: nowSec() }),
  });

interface SeedSpec {
  id: string;
  name: string;
  mac: string;
  serial: string;
  ip: string;
  model: string;
  manufacturer: string;
  firmware: string;
  hashrate: number; // TH/s
  powerKw: number;
  temperatureC: number;
  tempStatus: TemperatureStatus;
  efficiency: number; // J/TH
  status: DeviceStatus;
  pairing: PairingStatus;
  rack?: string;
  rackSlot?: string;
  groups?: string[];
}

const SEED_SPECS: SeedSpec[] = [
  {
    id: "dev_M0001",
    name: "M0001",
    mac: "A4:CF:12:8B:3E:01",
    serial: "S21-001",
    ip: "10.0.7.1",
    model: "Antminer S21",
    manufacturer: "Bitmain",
    firmware: "v4.2.1",
    hashrate: 200,
    powerKw: 3.5,
    temperatureC: 68,
    tempStatus: TemperatureStatus.OK,
    efficiency: 17.5,
    status: DeviceStatus.ONLINE,
    pairing: PairingStatus.PAIRED,
    rack: "R07",
    rackSlot: "01",
    groups: ["Dalton Bottom"],
  },
  {
    id: "dev_M0003",
    name: "M0003",
    mac: "A4:CF:12:8B:3E:03",
    serial: "S21-003",
    ip: "10.0.7.3",
    model: "Antminer S21",
    manufacturer: "Bitmain",
    firmware: "v4.2.1",
    hashrate: 198,
    powerKw: 3.6,
    temperatureC: 92,
    tempStatus: TemperatureStatus.CRITICAL,
    efficiency: 18.2,
    status: DeviceStatus.ERROR,
    pairing: PairingStatus.PAIRED,
    rack: "R07",
    rackSlot: "03",
    groups: ["Dalton Bottom"],
  },
  {
    id: "dev_M0008",
    name: "M0008",
    mac: "A4:CF:12:8B:3E:08",
    serial: "S21-008",
    ip: "10.0.7.8",
    model: "Antminer S21",
    manufacturer: "Bitmain",
    firmware: "v4.2.0",
    hashrate: 0,
    powerKw: 0,
    temperatureC: 0,
    tempStatus: TemperatureStatus.COLD,
    efficiency: 0,
    status: DeviceStatus.OFFLINE,
    pairing: PairingStatus.PAIRED,
    rack: "R07",
    rackSlot: "08",
    groups: ["Dalton Bottom"],
  },
  {
    id: "dev_M0012",
    name: "M0012",
    mac: "A4:CF:12:8B:3E:12",
    serial: "S21-012",
    ip: "10.0.7.12",
    model: "Antminer S21",
    manufacturer: "Bitmain",
    firmware: "v4.2.1",
    hashrate: 162,
    powerKw: 3.4,
    temperatureC: 84,
    tempStatus: TemperatureStatus.HOT,
    efficiency: 21.0,
    status: DeviceStatus.ONLINE,
    pairing: PairingStatus.PAIRED,
    rack: "R09",
    rackSlot: "12",
    groups: ["Night shift safe"],
  },
  {
    id: "dev_M0042",
    name: "M0042",
    mac: "A4:CF:12:8B:3E:42",
    serial: "S19P-042",
    ip: "10.0.7.42",
    model: "Antminer S19 Pro",
    manufacturer: "Bitmain",
    firmware: "v3.8.4",
    hashrate: 110,
    powerKw: 3.25,
    temperatureC: 72,
    tempStatus: TemperatureStatus.HOT,
    efficiency: 29.5,
    status: DeviceStatus.MAINTENANCE,
    pairing: PairingStatus.PAIRED,
    rack: "R11",
    rackSlot: "06",
    groups: ["Aging inventory"],
  },
  {
    id: "dev_M0058",
    name: "M0058",
    mac: "A4:CF:12:8B:3E:58",
    serial: "PRO-058",
    ip: "10.0.7.58",
    model: "Proto Rig 1",
    manufacturer: "Block",
    firmware: "v1.4.0",
    hashrate: 280,
    powerKw: 4.2,
    temperatureC: 62,
    tempStatus: TemperatureStatus.OK,
    efficiency: 15.0,
    status: DeviceStatus.ONLINE,
    pairing: PairingStatus.PAIRED,
    rack: "R12",
    rackSlot: "04",
    groups: ["High efficiency"],
  },
];

const buildSnapshot = (spec: SeedSpec): MinerStateSnapshot => {
  const placement =
    spec.rack || spec.groups?.length
      ? create(PlacementRefsSchema, {
          rack: spec.rack ? { label: spec.rack } : undefined,
          groups: spec.groups?.map((label) => ({ label })) ?? [],
        })
      : undefined;

  return create(MinerStateSnapshotSchema, {
    deviceIdentifier: spec.id,
    name: spec.name,
    macAddress: spec.mac,
    serialNumber: spec.serial,
    powerUsage: [measurement(spec.powerKw, MeasurementUnit.KILOWATT)],
    temperature: [measurement(spec.temperatureC, MeasurementUnit.CELSIUS)],
    hashrate: [measurement(spec.hashrate, MeasurementUnit.TERAHASH_PER_SECOND)],
    efficiency: [measurement(spec.efficiency, MeasurementUnit.JOULES_PER_TERAHASH)],
    timestamp: create(TimestampSchema, { seconds: nowSec() }),
    ipAddress: spec.ip,
    url: `http://${spec.ip}`,
    deviceStatus: spec.status,
    pairingStatus: spec.pairing,
    model: spec.model,
    manufacturer: spec.manufacturer,
    temperatureStatus: spec.tempStatus,
    firmwareVersion: spec.firmware,
    driverName: spec.manufacturer.toLowerCase() === "block" ? "proto" : "antminer",
    workerName: spec.name.toLowerCase(),
    rackPosition: spec.rackSlot ?? "",
    placement,
  });
};

export function getSeedMiners(): Record<string, MinerStateSnapshot> {
  const out: Record<string, MinerStateSnapshot> = {};
  for (const spec of SEED_SPECS) out[spec.id] = buildSnapshot(spec);
  return out;
}

export function getSeedMinerIds(): string[] {
  return SEED_SPECS.map((s) => s.id);
}
