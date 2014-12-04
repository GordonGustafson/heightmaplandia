import Image
from perlin import SimplexNoise, BaseNoise

size = 2048
freq = [300.0,100.0,75.0,50.0,  5.0,1.0]
amps = [1.0  ,  0.6, 0.3,0.2,0.1,0.05]

img = Image.new( 'RGB', (size,size), "black") # create a new black image
pixels = img.load() # create the pixel map

noise = SimplexNoise()
noise.randomize()
 
for i in range(img.size[0]):    # for every pixel:
    for j in range(img.size[1]):
        value = 0
        for octave in range(0,len(freq)):
            f = freq[octave]
            v = noise.noise2(i/f,j/f)
            value += v*amps[octave]
        value = (value+1)/2 #-1,1 to 0,1
        value = int((value/sum(amps))*255) #convert to [0,255]
        pixels[i,j] = (value, value, value) # set the colour accordingly
 
img.save("test_2.png")