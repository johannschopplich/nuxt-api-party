<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { components } from '#nuxt-api-party/petStore'

type Pet = components['schemas']['Pet']

const availableStatus = ['pending', 'sold'] as const
const status = ref<'pending' | 'sold'>()

const { data, error } = usePetStoreData('pet/findByStatus', {
  query: computed(() => ({
    status: status.value ?? 'pending',
  })),
})

// eslint-disable-next-line no-console
watch(error, value => console.log(value))

const petData = ref<Pet>()

async function fetchPetData(petId: number) {
  try {
    petData.value = await $petStore('pet/{petId}', {
      method: 'GET',
      pathParams: {
        petId,
      },
    })
  }
  catch (e) {
    console.error(e)
  }
}

const createdPet = ref<Pet>()

async function abandonGarfield() {
  // put the fat lazy cat up for adoption
  try {
    createdPet.value = await $petStore('pet', {
      method: 'POST',
      body: {
        id: 123,
        name: 'Garfield',
        status: 'available',
        photoUrls: ['https://example.com/garfield.png'],
        category: { id: 1, name: 'Cats' },
        tags: [
          { id: 10, name: 'lazy' },
          { id: 20, name: 'fat' },
        ],
      } satisfies Pet,
    })
  }
  catch (e) {
    if (e instanceof FetchError) {
      console.error('statusCode:', (e as FetchError).statusCode)
      console.error('statusMessage:', (e as FetchError).statusMessage)
      console.error('data:', (e as FetchError).data)
    }
    else {
      console.error(e)
    }
  }
}
</script>

<template>
  <div>
    <h2>usePetStoreData</h2>
    <p>Status: {{ status }}</p>
    <p>
      <button @click="status = availableStatus[status ? availableStatus.indexOf(status) + 1 % 3 : 0]">
        Next status
      </button>
    </p>
    <p>
      <button v-for="pet in data" :key="pet.id" @click="fetchPetData(pet.id!)">
        {{ pet.name }}
      </button>
    </p>
    <pre>{{ JSON.stringify(petData, undefined, 2) }}</pre>
    <p>
      <button @click="abandonGarfield">
        Put up Garfield
      </button>
    </p>
    <p v-if="createdPet">
      Garfield can now be adopted.
      <pre>{{ createdPet }}</pre>
    </p>
  </div>
</template>
