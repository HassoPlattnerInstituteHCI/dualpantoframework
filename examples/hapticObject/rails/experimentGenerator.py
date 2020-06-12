import numpy as np
import pandas as pd

# experient cases (input here!)
starting_positions = [[50,-60], [-20,-50]] #... (x,y)
angles             = [0, 10] #... (degree)
target_positions   = [[-60,-50],[40,-100]] #TODO: calculate x, y based on starting positions / angles

num_repetitions    = 3 #here, how many times that unique test cases are presented? (has to be divisible by trials_per_block?)
trials_per_block   = 10
conditions         = ['rail', 'control'] #rail / control condition

# dependent variables (automatically generated)
num_positions = len(starting_positions)

df = pd.DataFrame(columns=['block_id','starting_x','starting_y','target_x','target_y','cond']);

#TODO: 1. shuffle each condition(df.shuffle? make sub-dataframe)    2. construct block
#TODO: 3. construct block_id.

for c in conditions:
    for n in range(0,num_repetitions):
        for i in range(0, num_positions):
            for j in range(0, num_positions):
                df=df.append({
                    'block_id':0,
                    'starting_x':starting_positions[i][0],
                    'starting_y':starting_positions[i][1],
                    'target_x':target_positions[j][0],
                    'target_y':target_positions[j][1],
                    'cond':c
                }, ignore_index=True)
df.to_csv('./protocol.csv')