<script setup lang="ts">
/* eslint-disable unused-imports/no-unused-vars */
import type { NuxtError } from '#app'
import type { components as Components, RequestBody as PetStoreRequestBody, Response as PetStoreResponse } from '#nuxt-api-party/petStore'
import { $petStore, computed, ref, usePetStoreData, watch } from '#imports'

type Pet = Components['schemas']['Pet']

// For demonstration purposes: How to extract the request body and response types
type PetIdRequestBody = PetStoreRequestBody<'addPet'>
type PetIdResponse = PetStoreResponse<'getPetById'>

const availableStatus = ['pending', 'sold'] as const
const status = ref<typeof availableStatus[number] | undefined>()
const { data: user, execute } = await usePetStoreData('/user/{username}', {
  path: { username: 'user1' },
  cache: true,
})

const { data, error } = await usePetStoreData('/pet/findByStatus', {
  query: computed(() => ({
    status: status.value ?? 'pending',
  })),
  transform(response) {
    return response.map(({ id, name }) => ({
      id,
      name,
    }))
  },
})

watch(error, value => console.error(value))

async function updateUser() {
  try {
    // Will error because of authentication
    await $petStore('/user/{username}', {
      method: 'PUT',
      path: { username: 'user1' },
      body: {
        firstName: 'first name 2',
      },
      cache: false,
    })
    await execute()
  }
  catch (error) {
    console.error(error)
  }
}

const petData = ref<Pet | undefined>()

async function fetchPetData(petId: number) {
  try {
    petData.value = await $petStore('/pet/{petId}', {
      method: 'GET',
      path: {
        petId,
      },
    })
  }
  catch (error) {
    console.error(error)
  }
}

const createdPet = ref<Pet>()

async function abandonGarfield() {
  // Put the fat lazy cat up for adoption
  try {
    createdPet.value = await $petStore('/pet', {
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
  catch (error) {
    console.error(error as NuxtError)
    // Log the API response body
    console.error('Response body:', (error as NuxtError).data)
  }
}
</script>

<template>
  <div>
    <h2>User</h2>
    <p
      v-if="user"
      class="name"
    >
      {{ user.firstName }} {{ user.lastName }}
      <button @click="updateUser">
        Update
      </button>
    </p>
    <hr>

    <h2>usePetStoreData</h2>
    <p>Status: {{ status }}</p>
    <p>
      <button @click="status = availableStatus[status ? availableStatus.indexOf(status) + 1 % 3 : 0]">
        Next status
      </button>
    </p>

    <h3>Pets</h3>
    <ul>
      <li
        v-for="pet in data"
        :key="pet.id"
      >
        <button
          @click="fetchPetData(pet.id!)"
        >
          {{ pet.name }}
        </button>
      </li>
    </ul>
    <pre>{{ JSON.stringify(petData, undefined, 2) }}</pre>
    <hr>

    <h3>Abandon Garfield</h3>
    <p>
      <button @click="abandonGarfield">
        Put up Garfield
      </button>
    </p>
    <template v-if="createdPet">
      <p>Garfield can now be adopted.</p>
      <pre>{{ createdPet }}</pre>
    </template>
  </div>
</template>

<style scoped>
.name {
  text-transform: capitalize;
}
</style>
