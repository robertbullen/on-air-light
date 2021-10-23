# on-air-light

Implements an "On Air" light that indicates when a Zoom user is in a "do not disturb" status. Zoom invokes a webhook implemented on AWS using API Gateway and Lambda, which in turn invoke a Particle Photon Internet Button function.

## References

- [How to Create Your Own Smart Zoom Status Light](https://medium.com/the-kickstarter/how-to-create-your-own-smart-zoom-status-light-5bfaf10052df) - This is a similar project, except it uses Integromat and IFFT as the integration layer to control a smart bulb. The helpful bits were how to configure a Zoom OAuth app.
- [Particle Reference Documentation](https://docs.particle.io/reference/device-os/firmware/)
  - [Internet Button](https://docs.particle.io/reference/discontinued/button/) - The Internet Button is a discontinued product, but at its really just a prefabricated bundle of LEDs and buttons with a removable Photon at its heart.
- <https://github.com/wouterdebie/onair>
