/* Idempotent indexes supporting CTRL SEA API access paths. */
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

USE [ITI_Graduation_PortWatch];

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('portwatch_dw.fact_Daily_Ports') AND name='IX_fact_Daily_Ports_portid_date')
  CREATE NONCLUSTERED INDEX IX_fact_Daily_Ports_portid_date ON portwatch_dw.fact_Daily_Ports(portid,[date]) INCLUDE(portcalls,[import],[export],ISO3);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('portwatch_dw.fact_Daily_Ports') AND name='IX_fact_Daily_Ports_ISO3_date')
  CREATE NONCLUSTERED INDEX IX_fact_Daily_Ports_ISO3_date ON portwatch_dw.fact_Daily_Ports(ISO3,[date]) INCLUDE(portcalls,[import],[export],portid);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('portwatch_dw.fact_Daily_Ports') AND name='IX_fact_Daily_Ports_date_cover')
  CREATE NONCLUSTERED INDEX IX_fact_Daily_Ports_date_cover ON portwatch_dw.fact_Daily_Ports([date]) INCLUDE(portid,ISO3,portcalls,[import],[export]);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('portwatch_dw.Fact_Climate_Risk') AND name='IX_Fact_Climate_Risk_portid_measure')
  CREATE NONCLUSTERED INDEX IX_Fact_Climate_Risk_portid_measure ON portwatch_dw.Fact_Climate_Risk(portid,measure,scenario) INCLUDE(hazard,unit,value);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('portwatch_dw.Fact_Trade_Risk') AND name='IX_Fact_Trade_Risk_to_portid')
  CREATE NONCLUSTERED INDEX IX_Fact_Trade_Risk_to_portid ON portwatch_dw.Fact_Trade_Risk(to_portid,scenario) INCLUDE(from_ISO3,industry,days_downtime_at_port,trade_value_at_risk);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('portwatch_dw.Fact_Trade_Risk') AND name='IX_Fact_Trade_Risk_from_ISO3')
  CREATE NONCLUSTERED INDEX IX_Fact_Trade_Risk_from_ISO3 ON portwatch_dw.Fact_Trade_Risk(from_ISO3,scenario) INCLUDE(to_portid,industry,days_downtime_at_port,trade_value_at_risk);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('portwatch_dw.Fact_Trade_Risk') AND name='IX_Fact_Trade_Risk_scenario_industry_cover')
  CREATE NONCLUSTERED INDEX IX_Fact_Trade_Risk_scenario_industry_cover ON portwatch_dw.Fact_Trade_Risk(scenario,industry) INCLUDE(from_ISO3,to_portid,days_downtime_at_port,trade_value_at_risk);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('portwatch_dw.Fact_Spillover_Port') AND name='IX_Fact_Spillover_Port_capacity')
  CREATE NONCLUSTERED INDEX IX_Fact_Spillover_Port_capacity ON portwatch_dw.Fact_Spillover_Port(daily_capacity_at_risk DESC) INCLUDE(from_portid,to_portid,from_portname,to_portname,relative_capacity_at_risk);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('portwatch_dw.fact_Disruptions') AND name='IX_fact_Disruptions_portid_fromdate')
  CREATE NONCLUSTERED INDEX IX_fact_Disruptions_portid_fromdate ON portwatch_dw.fact_Disruptions(portid,fromdate) INCLUDE(eventid,ISO3,todate,value,n_affectedports);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('portwatch_dw.fact_Daily_Chockpoints') AND name='IX_fact_Daily_Chockpoints_portid_date')
  CREATE NONCLUSTERED INDEX IX_fact_Daily_Chockpoints_portid_date ON portwatch_dw.fact_Daily_Chockpoints(portid,[date]) INCLUDE(n_total,capacity);
