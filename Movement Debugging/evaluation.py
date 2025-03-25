import pandas as pd
import matplotlib.pyplot as plt
import sys


results = pd.read_csv("Results/studyResults_70260.csv", encoding="utf-8")
completion_times = results.loc[:, ["Time", "GuideLength"]]
completion_times.set_index(u"GuideLength", inplace=True)
print(completion_times.head())
completion_times.hist()