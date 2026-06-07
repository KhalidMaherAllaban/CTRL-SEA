CREATE DATABASE ctrl_sea;
GO

USE ctrl_sea;
GO

CREATE TABLE DimDate (
    DateKey INT NOT NULL PRIMARY KEY,
    FullDate DATE NOT NULL UNIQUE,
    DayNumber INT NOT NULL,
    MonthNumber INT NOT NULL,
    MonthName NVARCHAR(20) NOT NULL,
    QuarterNumber INT NOT NULL,
    YearNumber INT NOT NULL
);

CREATE TABLE DimCountry (
    CountryKey INT IDENTITY(1,1) PRIMARY KEY,
    Iso3 CHAR(3) NOT NULL UNIQUE,
    CountryName NVARCHAR(120) NOT NULL,
    Region NVARCHAR(120) NULL,
    IncomeGroup NVARCHAR(80) NULL
);

CREATE TABLE DimPort (
    PortKey INT IDENTITY(1,1) PRIMARY KEY,
    PortCode NVARCHAR(24) NOT NULL UNIQUE,
    PortName NVARCHAR(160) NOT NULL,
    CountryKey INT NOT NULL,
    Latitude DECIMAL(9,6) NOT NULL,
    Longitude DECIMAL(9,6) NOT NULL,
    CapacityTeu BIGINT NULL,
    PortType NVARCHAR(50) NULL,
    CONSTRAINT FK_DimPort_Country FOREIGN KEY (CountryKey) REFERENCES DimCountry(CountryKey)
);

CREATE TABLE DimIndustry (
    IndustryKey INT IDENTITY(1,1) PRIMARY KEY,
    IndustryCode NVARCHAR(40) NOT NULL UNIQUE,
    IndustryName NVARCHAR(160) NOT NULL
);

CREATE TABLE DimHazard (
    HazardKey INT IDENTITY(1,1) PRIMARY KEY,
    HazardCode NVARCHAR(40) NOT NULL UNIQUE,
    HazardName NVARCHAR(120) NOT NULL,
    HazardCategory NVARCHAR(80) NOT NULL
);

CREATE TABLE DimScenario (
    ScenarioKey INT IDENTITY(1,1) PRIMARY KEY,
    ScenarioCode NVARCHAR(40) NOT NULL UNIQUE,
    ScenarioName NVARCHAR(140) NOT NULL,
    ScenarioDescription NVARCHAR(500) NULL
);

CREATE TABLE DimChokepoint (
    ChokepointKey INT IDENTITY(1,1) PRIMARY KEY,
    ChokepointCode NVARCHAR(40) NOT NULL UNIQUE,
    ChokepointName NVARCHAR(160) NOT NULL,
    Latitude DECIMAL(9,6) NOT NULL,
    Longitude DECIMAL(9,6) NOT NULL,
    Region NVARCHAR(120) NULL
);

CREATE TABLE DimDisruptionEvent (
    DisruptionEventKey INT IDENTITY(1,1) PRIMARY KEY,
    EventCode NVARCHAR(60) NOT NULL UNIQUE,
    EventName NVARCHAR(180) NOT NULL,
    EventType NVARCHAR(80) NOT NULL,
    Severity NVARCHAR(30) NOT NULL,
    StartedAt DATETIME2 NOT NULL,
    EndedAt DATETIME2 NULL
);

CREATE TABLE DimVessel (
    VesselKey INT IDENTITY(1,1) PRIMARY KEY,
    ImoNumber NVARCHAR(20) NOT NULL UNIQUE,
    VesselName NVARCHAR(160) NOT NULL,
    VesselType NVARCHAR(80) NOT NULL,
    FlagCountryKey INT NULL,
    DeadweightTons DECIMAL(18,2) NULL,
    CONSTRAINT FK_DimVessel_FlagCountry FOREIGN KEY (FlagCountryKey) REFERENCES DimCountry(CountryKey)
);

CREATE TABLE DimTradeRoute (
    TradeRouteKey INT IDENTITY(1,1) PRIMARY KEY,
    RouteCode NVARCHAR(60) NOT NULL UNIQUE,
    OriginPortKey INT NOT NULL,
    DestinationPortKey INT NOT NULL,
    PrimaryChokepointKey INT NULL,
    RouteName NVARCHAR(180) NOT NULL,
    CONSTRAINT FK_DimTradeRoute_Origin FOREIGN KEY (OriginPortKey) REFERENCES DimPort(PortKey),
    CONSTRAINT FK_DimTradeRoute_Destination FOREIGN KEY (DestinationPortKey) REFERENCES DimPort(PortKey),
    CONSTRAINT FK_DimTradeRoute_Chokepoint FOREIGN KEY (PrimaryChokepointKey) REFERENCES DimChokepoint(ChokepointKey)
);

CREATE TABLE EtlRun (
    EtlRunKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    SourceSystem NVARCHAR(120) NOT NULL,
    LayerName NVARCHAR(40) NOT NULL,
    Status NVARCHAR(40) NOT NULL,
    StartedAt DATETIME2 NOT NULL,
    EndedAt DATETIME2 NULL
);

CREATE TABLE FactDailyPorts (
    FactDailyPortKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    DateKey INT NOT NULL,
    PortKey INT NOT NULL,
    VesselCount INT NOT NULL,
    ImportTonnage DECIMAL(18,2) NOT NULL,
    ExportTonnage DECIMAL(18,2) NOT NULL,
    TradeValueUsd DECIMAL(19,2) NOT NULL,
    WaitingHours DECIMAL(10,2) NOT NULL,
    RiskScore DECIMAL(5,2) NOT NULL,
    CONSTRAINT FK_FactDailyPorts_Date FOREIGN KEY (DateKey) REFERENCES DimDate(DateKey),
    CONSTRAINT FK_FactDailyPorts_Port FOREIGN KEY (PortKey) REFERENCES DimPort(PortKey)
);

CREATE TABLE FactDailyChokepoints (
    FactDailyChokepointKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    DateKey INT NOT NULL,
    ChokepointKey INT NOT NULL,
    VesselTransits INT NOT NULL,
    TradeValueUsd DECIMAL(19,2) NOT NULL,
    DelayHours DECIMAL(10,2) NOT NULL,
    RiskScore DECIMAL(5,2) NOT NULL,
    CONSTRAINT FK_FactDailyChokepoints_Date FOREIGN KEY (DateKey) REFERENCES DimDate(DateKey),
    CONSTRAINT FK_FactDailyChokepoints_Chokepoint FOREIGN KEY (ChokepointKey) REFERENCES DimChokepoint(ChokepointKey)
);

CREATE TABLE FactDailyCongestion (
    FactDailyCongestionKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    DateKey INT NOT NULL,
    PortKey INT NOT NULL,
    QueueVessels INT NOT NULL,
    MedianWaitingHours DECIMAL(10,2) NOT NULL,
    CongestionScore DECIMAL(5,2) NOT NULL,
    CONSTRAINT FK_FactDailyCongestion_Date FOREIGN KEY (DateKey) REFERENCES DimDate(DateKey),
    CONSTRAINT FK_FactDailyCongestion_Port FOREIGN KEY (PortKey) REFERENCES DimPort(PortKey)
);

CREATE TABLE FactTradeFlow (
    FactTradeFlowKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    DateKey INT NOT NULL,
    TradeRouteKey INT NOT NULL,
    VesselKey INT NULL,
    CargoValueUsd DECIMAL(19,2) NOT NULL,
    CargoVolumeTons DECIMAL(18,2) NOT NULL,
    RiskScore DECIMAL(5,2) NOT NULL,
    CONSTRAINT FK_FactTradeFlow_Date FOREIGN KEY (DateKey) REFERENCES DimDate(DateKey),
    CONSTRAINT FK_FactTradeFlow_Route FOREIGN KEY (TradeRouteKey) REFERENCES DimTradeRoute(TradeRouteKey),
    CONSTRAINT FK_FactTradeFlow_Vessel FOREIGN KEY (VesselKey) REFERENCES DimVessel(VesselKey)
);

CREATE TABLE FactClimateRisk (
    FactClimateRiskKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    DateKey INT NOT NULL,
    CountryKey INT NOT NULL,
    PortKey INT NULL,
    HazardKey INT NOT NULL,
    ScenarioKey INT NOT NULL,
    AssetDamageUsd DECIMAL(19,2) NOT NULL,
    ExposureScore DECIMAL(5,2) NOT NULL,
    VulnerabilityScore DECIMAL(5,2) NOT NULL,
    RiskScore DECIMAL(5,2) NOT NULL,
    CONSTRAINT FK_FactClimateRisk_Date FOREIGN KEY (DateKey) REFERENCES DimDate(DateKey),
    CONSTRAINT FK_FactClimateRisk_Country FOREIGN KEY (CountryKey) REFERENCES DimCountry(CountryKey),
    CONSTRAINT FK_FactClimateRisk_Port FOREIGN KEY (PortKey) REFERENCES DimPort(PortKey),
    CONSTRAINT FK_FactClimateRisk_Hazard FOREIGN KEY (HazardKey) REFERENCES DimHazard(HazardKey),
    CONSTRAINT FK_FactClimateRisk_Scenario FOREIGN KEY (ScenarioKey) REFERENCES DimScenario(ScenarioKey)
);

CREATE TABLE FactTradeRisk (
    FactTradeRiskKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    DateKey INT NOT NULL,
    CountryKey INT NOT NULL,
    IndustryKey INT NOT NULL,
    TradeValueAtRiskUsd DECIMAL(19,2) NOT NULL,
    DowntimeDays DECIMAL(10,2) NOT NULL,
    CapacityRiskPct DECIMAL(6,2) NOT NULL,
    RiskScore DECIMAL(5,2) NOT NULL,
    CONSTRAINT FK_FactTradeRisk_Date FOREIGN KEY (DateKey) REFERENCES DimDate(DateKey),
    CONSTRAINT FK_FactTradeRisk_Country FOREIGN KEY (CountryKey) REFERENCES DimCountry(CountryKey),
    CONSTRAINT FK_FactTradeRisk_Industry FOREIGN KEY (IndustryKey) REFERENCES DimIndustry(IndustryKey)
);

CREATE TABLE FactDisruptions (
    FactDisruptionKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    DateKey INT NOT NULL,
    DisruptionEventKey INT NOT NULL,
    PortKey INT NULL,
    CountryKey INT NOT NULL,
    ImpactedVessels INT NOT NULL,
    EstimatedLossUsd DECIMAL(19,2) NOT NULL,
    SeverityScore DECIMAL(5,2) NOT NULL,
    CONSTRAINT FK_FactDisruptions_Date FOREIGN KEY (DateKey) REFERENCES DimDate(DateKey),
    CONSTRAINT FK_FactDisruptions_Event FOREIGN KEY (DisruptionEventKey) REFERENCES DimDisruptionEvent(DisruptionEventKey),
    CONSTRAINT FK_FactDisruptions_Port FOREIGN KEY (PortKey) REFERENCES DimPort(PortKey),
    CONSTRAINT FK_FactDisruptions_Country FOREIGN KEY (CountryKey) REFERENCES DimCountry(CountryKey)
);

CREATE TABLE FactMonthlyTrade (
    FactMonthlyTradeKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    DateKey INT NOT NULL,
    OriginCountryKey INT NOT NULL,
    DestinationCountryKey INT NOT NULL,
    IndustryKey INT NOT NULL,
    Commodity NVARCHAR(120) NOT NULL,
    TradeValueUsd DECIMAL(19,2) NOT NULL,
    TradeVolumeTons DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_FactMonthlyTrade_Date FOREIGN KEY (DateKey) REFERENCES DimDate(DateKey),
    CONSTRAINT FK_FactMonthlyTrade_Origin FOREIGN KEY (OriginCountryKey) REFERENCES DimCountry(CountryKey),
    CONSTRAINT FK_FactMonthlyTrade_Destination FOREIGN KEY (DestinationCountryKey) REFERENCES DimCountry(CountryKey),
    CONSTRAINT FK_FactMonthlyTrade_Industry FOREIGN KEY (IndustryKey) REFERENCES DimIndustry(IndustryKey)
);

CREATE TABLE FactSpilloverPort (
    FactSpilloverPortKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    ScenarioKey INT NOT NULL,
    SourcePortKey INT NOT NULL,
    AffectedPortKey INT NOT NULL,
    DelayDays DECIMAL(10,2) NOT NULL,
    TradeLossUsd DECIMAL(19,2) NOT NULL,
    CapacityRiskPct DECIMAL(6,2) NOT NULL,
    CONSTRAINT FK_FactSpilloverPort_Scenario FOREIGN KEY (ScenarioKey) REFERENCES DimScenario(ScenarioKey),
    CONSTRAINT FK_FactSpilloverPort_Source FOREIGN KEY (SourcePortKey) REFERENCES DimPort(PortKey),
    CONSTRAINT FK_FactSpilloverPort_Affected FOREIGN KEY (AffectedPortKey) REFERENCES DimPort(PortKey)
);

CREATE TABLE FactSpilloverCountry (
    FactSpilloverCountryKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    ScenarioKey INT NOT NULL,
    SourceCountryKey INT NOT NULL,
    AffectedCountryKey INT NOT NULL,
    IndustryKey INT NOT NULL,
    TradeLossUsd DECIMAL(19,2) NOT NULL,
    SupplyChainImpactScore DECIMAL(5,2) NOT NULL,
    CONSTRAINT FK_FactSpilloverCountry_Scenario FOREIGN KEY (ScenarioKey) REFERENCES DimScenario(ScenarioKey),
    CONSTRAINT FK_FactSpilloverCountry_Source FOREIGN KEY (SourceCountryKey) REFERENCES DimCountry(CountryKey),
    CONSTRAINT FK_FactSpilloverCountry_Affected FOREIGN KEY (AffectedCountryKey) REFERENCES DimCountry(CountryKey),
    CONSTRAINT FK_FactSpilloverCountry_Industry FOREIGN KEY (IndustryKey) REFERENCES DimIndustry(IndustryKey)
);

CREATE TABLE FactSupplyChain (
    FactSupplyChainKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    DateKey INT NOT NULL,
    OriginPortKey INT NOT NULL,
    DestinationPortKey INT NOT NULL,
    IndustryKey INT NOT NULL,
    Commodity NVARCHAR(120) NOT NULL,
    DependencyScore DECIMAL(5,2) NOT NULL,
    TransitDays DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_FactSupplyChain_Date FOREIGN KEY (DateKey) REFERENCES DimDate(DateKey),
    CONSTRAINT FK_FactSupplyChain_OriginPort FOREIGN KEY (OriginPortKey) REFERENCES DimPort(PortKey),
    CONSTRAINT FK_FactSupplyChain_DestinationPort FOREIGN KEY (DestinationPortKey) REFERENCES DimPort(PortKey),
    CONSTRAINT FK_FactSupplyChain_Industry FOREIGN KEY (IndustryKey) REFERENCES DimIndustry(IndustryKey)
);

CREATE INDEX IX_DimPort_Country ON DimPort(CountryKey);
CREATE INDEX IX_FactDailyPorts_DatePort ON FactDailyPorts(DateKey, PortKey);
CREATE INDEX IX_FactTradeFlow_DateRoute ON FactTradeFlow(DateKey, TradeRouteKey);
CREATE INDEX IX_FactDailyCongestion_DatePort ON FactDailyCongestion(DateKey, PortKey);
CREATE INDEX IX_FactClimateRisk_CountryScenario ON FactClimateRisk(CountryKey, ScenarioKey);
CREATE INDEX IX_FactTradeRisk_CountryIndustry ON FactTradeRisk(CountryKey, IndustryKey);
GO
