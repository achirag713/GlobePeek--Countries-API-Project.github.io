
import React, { useEffect, useState } from 'react'
import CountryCard from './CountryCard'
import CountriesListShimmer from './CountriesListShimmer'

const API_KEY = 'rc_live_demo'

export default function CountriesList({ query = '' }) {
  const [countriesData, setCountriesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true)
        setError('')

        const allCountries = []
        let offset = 0
        let hasMore = true

        while (hasMore) {
          const response = await fetch(
            `https://api.restcountries.com/countries/v5?limit=100&offset=${offset}`,
            {
              headers: {
                Authorization: `Bearer ${API_KEY}`,
              },
            }
          )

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }

          const result = await response.json()

          if (result.errors?.length) {
            throw new Error(result.errors[0].message)
          }

          const countries = result.data?.objects ?? []

          allCountries.push(...countries)

          hasMore = result.data?.meta?.more === true
          offset += countries.length

          if (countries.length === 0) {
            hasMore = false
          }
        }

        const formattedCountries = allCountries.map((country) => ({
          ...country,
          name: {
            common: country.names?.common ?? 'Unknown',
          },
          flags: {
            svg: country.flag?.url_svg ?? '',
          },
          capital: country.capitals ?? [],
        }))

        setCountriesData(formattedCountries)
      } catch (err) {
        console.error('Failed to fetch countries:', err)
        setError(err.message || 'Unable to load countries.')
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  if (loading) return <CountriesListShimmer />

  if (error) return <p>{error}</p>

  const searchQuery = query.trim().toLowerCase()

  const filteredCountries = countriesData.filter((country) => {
    const name = country.name.common.toLowerCase()
    const region = (country.region ?? '').toLowerCase()

    return (
      name.includes(searchQuery) ||
      region.includes(searchQuery)
    )
  })

  return (
    <div className="countries-container">
      {filteredCountries.length > 0 ? (
        filteredCountries.map((country) => (
          <CountryCard
            key={country.codes?.alpha_2 || country.name.common}
            name={country.name.common}
            flag={country.flags.svg}
            population={country.population}
            region={country.region}
            capital={country.capital?.[0]}
            data={country}
          />
        ))
      ) : (
        <p>No countries found.</p>
      )}
    </div>
  )
}
