import Image
import ImageFilter
from perlin import SimplexNoise

OUTPUT_DIR = "../heightmaps/"
OUTPUT_PATH = OUTPUT_DIR+"generated.png"

IMAGE_WIDTH  = 1024
IMAGE_HEIGHT = 1024
frequencies = [300.0, 100.0, 75.0, 50.0, 5.0, 1.0]
amplitudes  = [1.0,     0.6,  0.3,  0.2, 0.1, 0.05]
octaveData = zip(frequencies, amplitudes)

img = Image.new('RGB', (IMAGE_WIDTH, IMAGE_HEIGHT), "black")
pixelBuffer = img.load()

noise = SimplexNoise()
noise.randomize()

print ("Generating heightmap")
for x in range(IMAGE_WIDTH):
    for y in range(IMAGE_HEIGHT):
        def octaveContributionToPixel(frequencyAmplitudePair):
            frequency, amplitude = frequencyAmplitudePair
            xCoordinate = x / frequency
            yCoordinate = y / frequency
            return noise.noise2(xCoordinate, yCoordinate) * amplitude

        contributionsToPixel = map(octaveContributionToPixel, octaveData)
        # each amplitude is the maximum amount that octave can contribute to
        # the pixel, so this gives a pixelValue in the range [-1, 1]
        pixelValue = sum(contributionsToPixel) / sum(amplitudes)
        pixelValue = (pixelValue + 1) / 2          # convert [-1,1] to [0,1]
        pixelValue = int(pixelValue * 255)         # convert to [0,255]
        pixelBuffer[x, y] = (pixelValue, pixelValue, pixelValue)

img.save(OUTPUT_PATH)
print "Noise generated"

# Advanced terrain shapping
##Parameters
CLIP_POINTS = (70,200)

##
spread = CLIP_POINTS[1] - CLIP_POINTS[0]
for x in range(IMAGE_WIDTH):
    for y in range(IMAGE_HEIGHT):
        (r,g,b) = pixelBuffer[x,y]
        intensity = (r+g+b)/3
        t = (intensity - CLIP_POINTS[0])/float(spread)
        if (t < 0):
            pixelBuffer[x,y] = (0,0,0)
        elif (t > 1):
            pixelBuffer[x,y] = (255,255,255)
        else:
            pixelBuffer[x,y] = (int(255*t),int(255*t),int(255*t))
img.save(OUTPUT_DIR+"contrasted.png")

#Do blur HACK HACK HACK
img = img.filter(ImageFilter.BLUR).filter(ImageFilter.BLUR).filter(ImageFilter.BLUR)
img.save(OUTPUT_DIR+"blur.png")
pixelBuffer = img.load()

## Edge falloff
for x in range(IMAGE_WIDTH):
    for y in range(IMAGE_HEIGHT):
        (r,g,b) = pixelBuffer[x,y]
        intensity = (r+g+b)/3
        distance = min(x,y,IMAGE_HEIGHT-y,IMAGE_WIDTH-x) #Manhattan distance to map edge
        #if (x==y):
        #   print "(%d,%d),%d,%d,%d" % (x,y,distance,intensity,intensity-(255*(1.0/((distance+1.0)**2))))
        intensity = max(0,intensity-(2048*(1.0/((distance+1)**2))))
        intensity = int(intensity)
        pixelBuffer[x,y] = (intensity,intensity,intensity)
img.save(OUTPUT_DIR+"edgefall.png")