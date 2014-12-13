import Image
from perlin import SimplexNoise

OUTPUT_PATH = "../heightmaps/generated.png"

IMAGE_WIDTH  = 2048
IMAGE_HEIGHT = 2048
frequencies = [300.0, 100.0, 75.0, 50.0, 5.0, 1.0]
amplitudes  = [1.0,     0.6,  0.3,  0.2, 0.1, 0.05]
octaveData = zip(frequencies, amplitudes)

img = Image.new('RGB', (IMAGE_WIDTH, IMAGE_HEIGHT), "black")
pixelBuffer = img.load()

noise = SimplexNoise()
noise.randomize()

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
