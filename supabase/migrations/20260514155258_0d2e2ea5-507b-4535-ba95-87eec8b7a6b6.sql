DO $$
DECLARE
  v_role uuid;
BEGIN
  SELECT role_id INTO v_role FROM public.assessment_definitions WHERE category='sql' LIMIT 1;

  INSERT INTO public.assessment_definitions (role_id, category, title, description, is_active) VALUES
  (v_role, 'power_bi', 'Power BI Essentials', 'DAX, data modeling, and visualization basics expected from data analyst freshers.', true),
  (v_role, 'tableau', 'Tableau Fundamentals', 'Calculated fields, LOD expressions, and dashboarding basics in Tableau.', true),
  (v_role, 'excel', 'Excel for Data Analysts', 'Formulas, pivot tables, lookups, and analytical functions in Excel.', true),
  (v_role, 'statistics', 'Statistics for Analysts', 'Descriptive stats, probability, distributions, and hypothesis testing.', true)
  ON CONFLICT DO NOTHING;
END $$;

WITH defs AS (
  SELECT id, category::text AS cat FROM public.assessment_definitions
  WHERE category IN ('sql','python','power_bi','tableau','excel','statistics')
)
INSERT INTO public.questions (assessment_id, prompt, options, correct_answer, explanation, order_index, points)
SELECT d.id, q.prompt, q.options::jsonb, q.correct_answer, q.explanation, q.order_index, 1
FROM defs d
JOIN (VALUES
  ('sql','Which clause filters rows AFTER aggregation?', '["WHERE","HAVING","GROUP BY","ORDER BY"]','HAVING','HAVING filters groups; WHERE filters rows before grouping.',100),
  ('sql','What does INNER JOIN return?', '["All rows from both tables","Only matching rows from both","All from left + matches","All from right + matches"]','Only matching rows from both','INNER JOIN keeps rows that match the join condition in both tables.',101),
  ('sql','Which function returns the number of rows?', '["SUM()","ROW()","COUNT(*)","TOTAL()"]','COUNT(*)','COUNT(*) counts every row including NULLs.',102),
  ('sql','How do you remove duplicate rows in a result?', '["UNIQUE","DISTINCT","DEDUPE","FILTER"]','DISTINCT','SELECT DISTINCT removes duplicate rows.',103),
  ('sql','Which ranking function leaves no gaps after ties?', '["RANK()","DENSE_RANK()","ROW_NUMBER()","NTILE()"]','DENSE_RANK()','DENSE_RANK gives consecutive ranks even after ties.',104),
  ('sql','Which JOIN keeps all rows from the left table?', '["INNER","LEFT","RIGHT","CROSS"]','LEFT','LEFT JOIN preserves all rows from the left table.',105),
  ('sql','What is the result of NULL = NULL?', '["TRUE","FALSE","NULL","ERROR"]','NULL','Comparisons with NULL yield NULL; use IS NULL.',106),
  ('sql','Which CTE keyword starts a recursive query?', '["WITH RECURSIVE","RECURSE","LOOP","REPEAT"]','WITH RECURSIVE','Recursive CTEs use WITH RECURSIVE.',107),
  ('sql','In standard SQL, non-aggregated selected columns must appear in?', '["GROUP BY","HAVING","DISTINCT","ORDER BY"]','GROUP BY','Standard SQL requires non-aggregated columns to appear in GROUP BY.',108),
  ('sql','Which window function returns a value from a previous row?', '["LAG()","LEAD()","FIRST_VALUE()","NTH_VALUE()"]','LAG()','LAG fetches a value from a prior row in the partition.',109),

  ('python','Which pandas method shows the first 5 rows?', '["head()","top()","first()","peek()"]','head()','df.head() returns the first 5 rows by default.',100),
  ('python','How do you read a CSV file in pandas?', '["pd.load_csv()","pd.read_csv()","pd.open_csv()","pd.import_csv()"]','pd.read_csv()','pandas.read_csv reads a CSV into a DataFrame.',101),
  ('python','Which library is best for numerical arrays?', '["NumPy","matplotlib","seaborn","requests"]','NumPy','NumPy provides ndarray and vectorized math.',102),
  ('python','How do you drop missing values from a DataFrame?', '["df.dropna()","df.removeNA()","df.fillna()","df.delete_null()"]','df.dropna()','dropna removes rows or columns with NaN.',103),
  ('python','Which method groups data and aggregates?', '["df.groupby()","df.cluster()","df.split()","df.bucket()"]','df.groupby()','groupby aggregates rows by keys.',104),
  ('python','What does df.merge() do?', '["Joins two DataFrames","Concatenates","Sorts","Filters"]','Joins two DataFrames','merge performs SQL-style joins on DataFrames.',105),
  ('python','Which is correct for a list comprehension?', '["[x*2 for x in lst]","(x*2 for x in lst)","{x*2: x in lst}","for x in lst: x*2"]','[x*2 for x in lst]','List comprehensions use square brackets.',106),
  ('python','Which function reshapes long to wide?', '["pivot()","melt()","stack()","explode()"]','pivot()','pivot turns long into wide; melt does the reverse.',107),
  ('python','How do you check pandas Series data type?', '["s.dtype","s.type()","s.kind","s.classify()"]','s.dtype','Series.dtype returns the data type.',108),
  ('python','Conventional pandas import?', '["import pandas as pd","import pd from pandas","from pandas import *","require pandas"]','import pandas as pd','Convention is `import pandas as pd`.',109),

  ('power_bi','What language is used to write measures in Power BI?', '["DAX","M","SQL","Python"]','DAX','DAX is used for measures and calculated columns.',100),
  ('power_bi','What language does Power Query use?', '["M","DAX","R","VBA"]','M','Power Query uses the M formula language.',101),
  ('power_bi','Which DAX function evaluates an expression in a modified filter context?', '["CALCULATE()","SUM()","FILTER()","ALL()"]','CALCULATE()','CALCULATE modifies filter context.',102),
  ('power_bi','Best practice for date intelligence in Power BI?', '["Use a dedicated Date table marked as date table","Use auto date/time only","Store dates as text","One date column per fact"]','Use a dedicated Date table marked as date table','A marked Date table enables time intelligence.',103),
  ('power_bi','Star schema in Power BI consists of:', '["One fact and many dimensions","Many facts only","One huge wide table","Snowflake dimensions only"]','One fact and many dimensions','Star schemas have a fact surrounded by dimensions.',104),
  ('power_bi','Which DAX function ignores all filters on a table/column?', '["ALL()","REMOVEFILTERS()","KEEPFILTERS()","ALLEXCEPT()"]','ALL()','ALL removes filters from the specified table or columns.',105),
  ('power_bi','Calculated column vs measure?', '["Column computes per row at refresh; measure at query time","They are identical","Measures are stored on disk","Columns recompute at query time"]','Column computes per row at refresh; measure at query time','Columns materialize per row; measures evaluate in filter context.',106),
  ('power_bi','Which visual is best for part-to-whole comparison?', '["Pie/Donut","Line","Scatter","Map"]','Pie/Donut','Pie or donut charts show part-to-whole relationships.',107),
  ('power_bi','Which feature enables row-level security?', '["RLS roles with DAX filters","Bookmarks","Themes","Slicers"]','RLS roles with DAX filters','RLS uses roles with DAX filter expressions.',108),
  ('power_bi','DirectQuery vs Import: a key trade-off?', '["DirectQuery is real-time but slower; Import is fast but cached","DirectQuery is always faster","Import always supports real-time","No difference"]','DirectQuery is real-time but slower; Import is fast but cached','Import caches data; DirectQuery queries the source live.',109),
  ('power_bi','Which function returns a distinct count?', '["DISTINCTCOUNT()","COUNT()","COUNTA()","COUNTROWS()"]','DISTINCTCOUNT()','DISTINCTCOUNT counts unique values in a column.',110),
  ('power_bi','CALCULATE([Sales], ALL(Product)) does what?', '["Sums sales ignoring product filters","Sum sales for current product","Returns blank","Filters to one product"]','Sums sales ignoring product filters','ALL clears Product filters in the calculation.',111),
  ('power_bi','Most common cardinality in star schemas?', '["One-to-many","Many-to-many","One-to-one","No relationship"]','One-to-many','Dimensions have one-to-many to facts.',112),
  ('power_bi','What does SUMX do?', '["Iterates a table summing an expression per row","Sums one column","Counts rows","Filters"]','Iterates a table summing an expression per row','SUMX is a row-context iterator.',113),
  ('power_bi','Where do you transform/clean data before loading?', '["Power Query Editor","Report view","Model view","DAX Studio"]','Power Query Editor','Power Query Editor handles ETL transformations.',114),

  ('tableau','What is a measure in Tableau?', '["A quantitative numeric field","A text field","A date filter","A worksheet"]','A quantitative numeric field','Measures are numeric fields aggregated in views.',100),
  ('tableau','What is a dimension in Tableau?', '["A categorical field used to slice data","An aggregation","A parameter","A workbook"]','A categorical field used to slice data','Dimensions are qualitative fields like Region or Category.',101),
  ('tableau','Which feature provides aggregation independent of view granularity?', '["LOD expression","Set","Group","Bin"]','LOD expression','LOD expressions compute at a specified granularity.',102),
  ('tableau','Which LOD keyword fixes the dimensions used in calculation?', '["FIXED","INCLUDE","EXCLUDE","ALL"]','FIXED','{FIXED [dim] : SUM(...)} fixes the calculation dimensions.',103),
  ('tableau','Live vs extract data source?', '["Live queries source on demand; extract is a snapshot","Both are snapshots","Both query live","Extract is slower than live"]','Live queries source on demand; extract is a snapshot','Extracts (.hyper) are snapshots; live connections query the source.',104),
  ('tableau','What builds an interactive dashboard layout?', '["Dashboard with floating/tiled containers","Story","Worksheet","Workbook"]','Dashboard with floating/tiled containers','Dashboards combine sheets using tiled or floating containers.',105),
  ('tableau','Packaged workbook with data file extension?', '[".twbx",".twb",".tds",".hyper"]','.twbx','.twbx packages workbook + extract.',106),
  ('tableau','How do you create a calculated field?', '["Analysis > Create Calculated Field","Data > Refresh","File > New","Format > Color"]','Analysis > Create Calculated Field','Created from the Analysis menu or data pane.',107),
  ('tableau','Which chart shows correlation between two measures?', '["Scatter plot","Pie","Bar","Treemap"]','Scatter plot','Scatter plots reveal correlation between two numeric measures.',108),
  ('tableau','Which feature allows dynamic user inputs in calculations?', '["Parameter","Filter","Set","Group"]','Parameter','Parameters are dynamic values users can change.',109),
  ('tableau','Which filter runs first?', '["Extract filters","Context filters","Dimension filters","Measure filters"]','Extract filters','Extract filters apply at extract time, before others.',110),
  ('tableau','What is a context filter used for?', '["Create a temporary table for other filters","Hide rows","Color marks","Sort"]','Create a temporary table for other filters','Context filters create a subset others operate against.',111),
  ('tableau','Which function returns a running total?', '["RUNNING_SUM()","WINDOW_SUM()","SUM()","TOTAL()"]','RUNNING_SUM()','RUNNING_SUM accumulates along the partition.',112),
  ('tableau','Tableau Public vs Desktop?', '["Public saves only to web and is free","Desktop saves only to web","Public costs more","No difference"]','Public saves only to web and is free','Tableau Public is free but saves only to its public cloud.',113),
  ('tableau','Best mark type for geographic data?', '["Map","Bar","Line","Heatmap"]','Map','Map mark type plots latitude/longitude.',114),

  ('excel','Which function looks up a value in the leftmost column?', '["VLOOKUP","HLOOKUP","INDEX","MATCH"]','VLOOKUP','VLOOKUP searches the first column of a range.',100),
  ('excel','Modern replacement for VLOOKUP in Excel 365?', '["XLOOKUP","FLOOKUP","LOOKUPX","SEARCHX"]','XLOOKUP','XLOOKUP is more flexible than VLOOKUP/HLOOKUP.',101),
  ('excel','Which combo is more flexible than VLOOKUP?', '["INDEX + MATCH","SUM + IF","TEXT + LEFT","ROW + COLUMN"]','INDEX + MATCH','INDEX/MATCH allows lookups in any direction.',102),
  ('excel','What does $A$1 mean?', '["Absolute reference to A1","Relative reference","Mixed reference","Named range"]','Absolute reference to A1','Dollar signs lock the row and column.',103),
  ('excel','Which feature summarizes large datasets interactively?', '["Pivot Table","Filter","Conditional Formatting","Data Validation"]','Pivot Table','Pivot tables aggregate by drag-and-drop.',104),
  ('excel','Function to count cells meeting a condition?', '["COUNTIF","COUNTA","COUNT","SUMIF"]','COUNTIF','COUNTIF counts based on a single criterion.',105),
  ('excel','Which functions join text strings?', '["CONCAT/TEXTJOIN","SUM","JOINTXT","MERGE"]','CONCAT/TEXTJOIN','CONCAT and TEXTJOIN combine text values.',106),
  ('excel','Which Excel feature loads, transforms, and combines data?', '["Power Query","Power Pivot","Solver","Goal Seek"]','Power Query','Power Query is Excel''s ETL tool.',107),
  ('excel','Shortcut to start a new line within a cell?', '["Alt + Enter","Shift + Enter","Ctrl + Enter","Tab"]','Alt + Enter','Alt+Enter inserts a line break in a cell.',108),
  ('excel','Which function returns today''s date?', '["TODAY()","NOW()","DATE()","CURRENT()"]','TODAY()','TODAY returns the current date without time.',109),
  ('excel','Which function returns the position of a value in a list?', '["MATCH","INDEX","LOOKUP","FIND"]','MATCH','MATCH returns the relative position of an item.',110),
  ('excel','Which feature locks cells from edits?', '["Protect Sheet","Freeze Panes","Group","Filter"]','Protect Sheet','Protect Sheet enforces locked-cell rules.',111),
  ('excel','Which dynamic array function returns unique values?', '["UNIQUE()","DISTINCT()","DEDUP()","SET()"]','UNIQUE()','UNIQUE returns the unique values in a range.',112),
  ('excel','Which function performs conditional sums?', '["SUMIFS","SUMIF","SUM","ADDIF"]','SUMIFS','SUMIFS supports multiple criteria.',113),
  ('excel','Best chart for trends over time?', '["Line chart","Pie chart","Doughnut","Treemap"]','Line chart','Line charts show trends across continuous time.',114),

  ('statistics','Which measure is most affected by outliers?', '["Mean","Median","Mode","IQR"]','Mean','The mean is sensitive to extreme values.',100),
  ('statistics','Standard deviation measures:', '["Spread around the mean","Central tendency","Skewness","Frequency"]','Spread around the mean','SD quantifies dispersion around the mean.',101),
  ('statistics','In a normal distribution, ~68% of data lies within:', '["1 SD of the mean","2 SD","3 SD","Half of SD"]','1 SD of the mean','Empirical rule: 68-95-99.7.',102),
  ('statistics','A p-value < 0.05 typically means:', '["Reject null hypothesis at 5% level","Accept null","Sample is biased","Data is normal"]','Reject null hypothesis at 5% level','At alpha=0.05 we reject the null when p<0.05.',103),
  ('statistics','Test for means of two independent groups?', '["Independent t-test","Chi-square","ANOVA","Wilcoxon signed-rank"]','Independent t-test','Independent samples t-test compares two group means.',104),
  ('statistics','Type I error is:', '["Rejecting a true null","Accepting a false null","Sampling error","Measurement error"]','Rejecting a true null','Type I = false positive.',105),
  ('statistics','Pearson correlation r ranges between:', '["-1 and 1","0 and 1","-100 and 100","0 and infinity"]','-1 and 1','Pearson r is in [-1, 1].',106),
  ('statistics','Which is a measure of central tendency?', '["Median","Variance","Range","SD"]','Median','Mean, median, mode are central tendency measures.',107),
  ('statistics','Sampling distribution of the mean tends to be normal due to:', '["Central Limit Theorem","Law of Large Numbers","Bayes Theorem","Chebyshev"]','Central Limit Theorem','CLT explains normality for large n.',108),
  ('statistics','Which plot best detects outliers?', '["Box plot","Pie chart","Bar chart","Stacked area"]','Box plot','Box plots highlight outliers via whiskers.',109),
  ('statistics','In hypothesis testing, the null hypothesis usually states:', '["No effect or no difference","A strong effect","Sample bias","Variance is zero"]','No effect or no difference','H0 represents the status quo of no effect.',110),
  ('statistics','Which value indicates perfect negative correlation?', '["-1","0","1","0.5"]','-1','r = -1 is perfect inverse linear relationship.',111),
  ('statistics','Distribution for successes in n Bernoulli trials?', '["Binomial","Poisson","Normal","Exponential"]','Binomial','Binomial models successes in n Bernoulli trials.',112),
  ('statistics','A 95% confidence interval means:', '["Method captures the true parameter 95% of samples","95% probability the parameter is in this interval","Data is 95% accurate","P-value is 0.95"]','Method captures the true parameter 95% of samples','Frequentist interpretation of CI.',113),
  ('statistics','Statistic that measures linear relationship strength?', '["Pearson correlation","Mean","Median","Mode"]','Pearson correlation','Pearson r measures linear association.',114)
) AS q(cat, prompt, options, correct_answer, explanation, order_index)
ON d.cat = q.cat;