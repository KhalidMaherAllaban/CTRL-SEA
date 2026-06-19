/*
  CTRL SEA consumes the existing ITI_Graduation_PortWatch warehouse.
  This script intentionally performs validation only; it never creates or
  replaces warehouse objects.
*/
USE [ITI_Graduation_PortWatch];
SET NOCOUNT ON;

DECLARE @required TABLE (schema_name sysname, table_name sysname);
INSERT INTO @required(schema_name, table_name) VALUES
('portwatch_dw','dimension_Date'),
('portwatch_dw','dimension_Country'),
('portwatch_dw','dimension_Ports'),
('portwatch_dw','dimension_ChockPoints'),
('portwatch_dw','dimension_Disruption_Event'),
('portwatch_dw','Fact_Climate_Risk'),
('portwatch_dw','fact_Daily_Chockpoints'),
('portwatch_dw','fact_Daily_Ports'),
('portwatch_dw','fact_Disruptions'),
('portwatch_dw','fact_Monthly_Trade'),
('portwatch_dw','Fact_Spillover_Country'),
('portwatch_dw','Fact_Spillover_Port'),
('portwatch_dw','Fact_Spillover_Supply'),
('portwatch_dw','Fact_Trade_Risk');

IF EXISTS (
  SELECT 1 FROM @required r
  WHERE OBJECT_ID(QUOTENAME(r.schema_name) + '.' + QUOTENAME(r.table_name), 'U') IS NULL
)
BEGIN
  SELECT r.schema_name, r.table_name
  FROM @required r
  WHERE OBJECT_ID(QUOTENAME(r.schema_name) + '.' + QUOTENAME(r.table_name), 'U') IS NULL;
  THROW 50001, 'Required PortWatch warehouse tables are missing.', 1;
END;

SELECT r.schema_name, r.table_name, SUM(CASE WHEN p.index_id IN (0,1) THEN p.rows ELSE 0 END) AS row_count
FROM @required r
JOIN sys.schemas s ON s.name=r.schema_name
JOIN sys.tables t ON t.schema_id=s.schema_id AND t.name=r.table_name
LEFT JOIN sys.partitions p ON p.object_id=t.object_id
GROUP BY r.schema_name,r.table_name
ORDER BY r.schema_name,r.table_name;
