package io.saadmughal.assignment05.service;

import io.saadmughal.assignment05.dto.ExchangeRatesDTO;
import io.saadmughal.assignment05.entity.ExchangeRates;
import io.saadmughal.assignment05.repository.ExchangeRatesRepository;
import io.saadmughal.assignment05.vo.ExchangeRatesQueryVO;
import io.saadmughal.assignment05.vo.ExchangeRatesUpdateVO;
import io.saadmughal.assignment05.vo.ExchangeRatesVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
public class ExchangeRatesService {

    @Autowired
    private ExchangeRatesRepository exchangeRatesRepository;

    public Long save(ExchangeRatesVO vO) {
        ExchangeRates bean = new ExchangeRates();
        BeanUtils.copyProperties(vO, bean);
        bean = exchangeRatesRepository.save(bean);
        return bean.getId();
    }

    public void delete(Long id) {
        exchangeRatesRepository.deleteById(id);
    }

    public void update(Long id, ExchangeRatesUpdateVO vO) {
        ExchangeRates bean = requireOne(id);
        BeanUtils.copyProperties(vO, bean);
        exchangeRatesRepository.save(bean);
    }

    public ExchangeRatesDTO getById(Long id) {
        ExchangeRates original = requireOne(id);
        return toDTO(original);
    }

    public Page<ExchangeRatesDTO> query(ExchangeRatesQueryVO vO) {
        throw new UnsupportedOperationException();
    }

    private ExchangeRatesDTO toDTO(ExchangeRates original) {
        ExchangeRatesDTO bean = new ExchangeRatesDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private ExchangeRates requireOne(Long id) {
        return exchangeRatesRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}
